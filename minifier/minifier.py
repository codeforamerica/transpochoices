#!/usr/bin/python

# By Jeff Adams
# Copyright (c) 2011 Azavea, Inc.
# 
# Permission is hereby granted, free of charge, to any person
# obtaining a copy of this software and associated documentation
# files (the "Software"), to deal in the Software without
# restriction, including without limitation the rights to use,
# copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following
# conditions:
# 
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
# WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
# OTHER DEALINGS IN THE SOFTWARE.

import optparse
import os
import platform
import re
import shutil
import subprocess
import sys
import traceback

class Minifier(object):
    def __init__(self):
        self._init_parser()

        self._compressorfile = None
        self._rhinofile = None
        self._configmtime = None
        self._numerrors = 0
        self._numwarnings = 0
        self._configsections = []
        self._jslintfile = None
        self._use_wscript = (platform.system() == 'Windows')

    def _init_parser(self):
        u = '%prog [options]'
        d = 'The Azavea Minifier merges your files, runs them through JSLint,' \
            ' and then minifies them using the YUI Compressor.'
        e = """
The config file should look something like this:

    # This is a comment.
    [js/output1.file] --optional_options
    js/input1.file
    js/input2.file
    [styles/output2.file]
    styles/input3.file
    styles/input4.file
        
All file names/paths are assumed to be subdirectories of the input and
output directories."""

        self.epilog = e

        self.parser = p = optparse.OptionParser(usage=u, description=d)

        p.add_option('-i', '--input-dir', dest='inputdir', default='.',
                     help='input file paths start in DIR [default: %default]',
                     metavar='DIR')
        p.add_option('-o', '--output-dir', dest='outputdir', default='.',
                     help='output file paths start in DIR [default: %default]',
                     metavar='DIR')
        p.add_option('-c', '--config', dest='configfile', default='minifier.conf',
                     help='use PATH as the config file [default %default)',
                     metavar='PATH')
        p.add_option('--yui', dest='yuijar', default=None,
                     help='use YUI jar at PATH (normally looks for one adjacent '
                          'to this script)',
                     metavar='PATH')
        p.add_option('-v', '--verbose', default=False, dest='verbose',
                     action='store_true', help='produce extra output')

        g = optparse.OptionGroup(p, "Config Options",
                                 'These may be used on the command line, to '
                                 'apply to everything, or in config file '
                                 'header rows ([outfile.js] --no-lint) to '
                                 'apply only to that section.')

        g.add_option('--no-comments', dest='nocomments', default=False,
                     action='store_true',
                     help='do not insert header/footer comment in concatenated file')
        g.add_option('--no-min', dest='nominify', default=False, action='store_true',
                     help='do not minify concatenated file')
        g.add_option('--no-css-images', dest='nocssimages', default=False,
                     action='store_true',
                     help='do not look for images in css to copy with the css')
        g.add_option('--no-lint', dest='nolint', default=False, action='store_true',
                     help='do not run jslint')
        g.add_option('--lint-opts', dest='lintopts', default='',
                     help='include custom OPTS for jslint, as a json object [ex: '
                          '--lint-opts {"evil"="false"}]',
                     metavar='OPTS')
        g.add_option('--force', dest='force', default=False, action='store_true',
                     help='force minify even if files are up to date')

        p.add_option_group(g)

        # This is a small hack to get optparse to output our epilog the way we
        # want. We could include a custom formatter but that would end up being
        # a lot more complicated.
        _orig_help = p.print_help
        def myhelp():
            _orig_help()
            print self.epilog
        p.print_help = myhelp

        # This allows us to print the full help output on user errors.
        def myerror(msg):
            prog = os.path.basename(sys.argv[0])
            print '%s: %s\n' % (prog, msg)
            p.print_help()
            sys.exit(1)
        p.error = myerror

    def err(self, msg, **kwargs):
        self.displayerror(message=msg, **kwargs)
        self.parser.print_help()
        sys.exit(1)

    def run(self, args):
        self._init_parser()

        self.opts, _ = self.parser.parse_args()

        print "Welcome to the Azavea Minifier!  Use -v for verbose mode."

        self.findfiles()
        self.parseconfig()
        self.mergeandminify()

        print ""
        if self._numwarnings > 0:
            print "*** Warnings encountered: %d" % self._numwarnings
        if self._numerrors > 0:
            print "*** Errors encountered: %d" % self._numerrors
        sys.exit(self._numerrors)

    def filter_by_re(self, path, regex):
        for name in os.listdir(path):
            if regex.match(name):
                # use the first match we get
                return os.path.join(path, name)
        return None

    yuijar_re = re.compile(r'^yuicompressor.*\.jar$')
    jslint_re = re.compile(r'^jslint.*\.js$')
    rhino_re = re.compile(r'^js\.jar$')
    def findfiles(self):
        # Find the directory this program lives in, used to find other files.
        mypath = os.path.dirname(os.path.realpath(__file__))

        # If the YUI jar file was specified, use it. Otherwise, find it.
        if self.opts.yuijar:
            self._compressorfile = self.opts.yuijar
        else:
            self._compressorfile = self.filter_by_re(mypath, self.yuijar_re)

        if not self._compressorfile:
            self.err("Can't find YUI in %r (use --yui if needed)" % mypath)

        if not self.opts.nolint:
            self._jslintfile = self.filter_by_re(mypath, self.jslint_re)
            if not self._jslintfile:
                self.err("Can't find jslint in %r" % mypath)

            if not self._use_wscript:
                self._rhinofile = self.filter_by_re(mypath, self.rhino_re)
                if not self._rhinofile:
                    self.err("Can't find js.jar (rhino) in %r" % mypath)

    token_re = re.compile(r'\S+|"(?:[^"\\]|\\.)*"')
    def splitsubargs(self, s):
        '''
        Helper function used by parseconfig() to seperate embedded args from
        section headers (e.g. [foo] -a -b -c "one two")
        '''
        return self.token_re.findall(s)

    begin_re = re.compile(r'^\s*\[(.+?)\]\s*(.*?)\s*$')
    end_re = re.compile(r'^\s*$')
    comment_re = re.compile(r'#.*$')
    body_re = re.compile(r'^\s*(.+?)\s*$')
    def parseconfig(self):
        """
        Reads all the contents of the config file, and verifies that the input
        files all exist.
        """
        f = None
        try:
            self._configmtime = os.path.getmtime(self.opts.configfile)
            f = open(self.opts.configfile)
        except Exception as e:
            self.err("Can't open config file %r" % self.opts.configfile)

        # Read the file, ignoring comments.
        curr = {}
        try:
            for line in f:
                line = self.comment_re.sub('', line).strip()
    
                if self.end_re.match(line):
                    if 'outpath' in curr:
                        self._configsections.append(curr)
                        curr = {}
                    continue
    
                m = self.begin_re.match(line)
                if m:
                    path = self.fixslashes(os.path.join(self.opts.outputdir,
                                                        m.group(1)))
                    subargs = self.splitsubargs(m.group(2))
                    curr['outpath'] = path
                    curr['args'], _ = self.parser.parse_args(subargs)
                    curr['inpaths'] = []
                    continue
                    
                m = self.body_re.match(line)
                if m:
                    path = self.fixslashes(os.path.join(self.opts.inputdir,
                                                        m.group(1)))
                    if not os.path.exists(path):
                        self.displayerror(filename=path,
                                          message="Not merging file " + path +
                                                  " because it doesn't exist.")
                        self._numerrors += 1
                    else:
                        curr['inpaths'].append(path)
                    continue
                raise Exception(
                    'Entered impossible state while parsing config file: %r' % line)
        except Exception as e:
            self.err("Error while parsing config file:\n" + str(e) + "\n" +
                     traceback.format_exc(e))

        if 'outpath' in curr:
            self._configsections.append(curr)

    def fixslashes(self, path):
        """Converts all slashes in the path to be correct for this os."""
        path = path.replace("\\", os.sep);
        path = path.replace("/", os.sep);
        return path;

    def mergeandminify(self):
        """
        Merges all the groups of input files into the output files, then
        minifies the output files.
        """
        for section in self._configsections:
            outpath = section["outpath"]
            filetype = None
            if outpath.upper().endswith(".CSS"):
                filetype = "CSS"
            elif outpath.upper().endswith(".JS"):
                filetype = "JS"
            if filetype == "JS" or filetype == "CSS":
                self.mergefiles(section["inpaths"], outpath, filetype,
                                section["args"])
                if ((not self.opts.nominify) and
                    ((not section["args"]) or
                     (not section["args"].nominify))):

                    # Now produce a minified version
                    self.minify(outpath, section["args"])
            else:
                # Else assume it is referring to a directory.
                self.mergedir(section["inpaths"], outpath)

    def mergedir(self, inpaths, outdir):
        """
        Puts all the files referred to in the config into this directory.

        inpaths -- List of (appropriately path-qualified) input files to
                   copy into the directory.
        outdir -- Directory to put all the files into.

        """
        if not outdir.endswith(os.sep):
            outdir += os.sep
        self.displayinfo("\nCopying to " + outdir)
        self.ensuredirexists(outdir + "junk.file")
        for inpath in inpaths:
            self.displayinfo("  < " + inpath)
            try:
                # We already checked that the input file/dir exists
                # when we parsed the config.
                # It's a directory, copy all its contents.
                if (os.path.isdir(inpath)):
                    numcopied = self.copydir(inpath, outdir)
                    self.displayinfo("    " + numcopied + " files/folders copied.")
                elif (os.path.isfile(inpath)):
                    shutil.copyfile(inpath,
                                    os.path.join(outdir,
                                                 os.path.basename(inpath)))
                else:
                    self.displayerror(filename=inpath, message=
                        "Unable to access " +
                        inpath + " as a file or a directory.")
            except Exception as e:
                self.displayerror(filename=inpath,
                    message="Unable to copy " + inpath + " to " + outdir,
                    e=e)

    def mergefiles(self, infiles, outfile, filetype, arguments):
        """
        Merges either CSS or Javascript files.

        infiles -- List of (appropriately path-qualified) input files to
                   copy into the directory.
        outfile --  Full output file path.
        filetype --  File type (JS or CSS)
        arguments -- Any command line or sectional arguments.

        """
        # Optimization: First check if the input files are all older than the
        # output file, nothing has changed and no need to do anything.
        if self.opts.force or arguments.force:
            domerge = True
        else:
            domerge = not (os.path.exists(outfile) and os.path.isfile(outfile))

        if not domerge:
            outfilemtime = os.path.getmtime(outfile)
            if self._configmtime > outfilemtime:
                # Config was modified more recently than our output, contents
                # may have changed.
                domerge = True
            else:
                # When parsing the config file we already verified the
                # input files exist, and made sure the names are fully
                # qualified.
                for infile in infiles:
                    infilemtime = os.path.getmtime(infile)
                    if infilemtime > outfilemtime:
                        # Input is newer, need to do something.
                        domerge = True
                        break
        if not domerge:
            self.displayinfo("Skipping " + outfile +
                " because it appears up-to-date.  Use --force to override.")
            return

        images_by_infile = {}

        self.displayinfo("\nWriting " + outfile)
        self.ensuredirexists(outfile)

        # Open a new output stream, overwriting any existing file.
        writer = None
        try:
            writer = open(outfile, "w")
        except Exception as e:
            self.displayerror(filename=outfile,
                message="Unable to open " + outfile + " for writing.", e=e)
            self.displaydirections()
            sys.exit(-16)
        try:
            # infiles exist and are fully qualified.
            for infile in infiles:
                self.displayinfo("  < " + infile)
                if (not self.opts.nocomments) and (not arguments.nocomments):
                    writer.write("\n")
                    writer.write("/******************** Begin " +
                        infile.ljust(30) + " ********************/\n")
                infileobj = None
                try:
                    infileobj = open(infile, "r")
                except Exception as e:
                    self.displayerror(filename=infile, message=
                        "Unable to open " + infile + " for reading.", e=e)
                    self.displaydirections()
                    sys.exit(-17)

                # Assuming we were able to open everything, copy from in
                # to out.
                try:
                    contents = infileobj.read()

                    # Since CSS file paths are relative, if we're copying
                    # images, we need to figure out all the images this
                    # CSS file uses.
                    if ((not self.opts.nocssimages) and
                            ((not arguments) or
                             (not arguments.nocssimages)) and
                            (filetype == "CSS")):
                        images_by_infile[infile] = self.extractpaths(
                            infile, contents)
                    # Write a newline so we don't accidentally concatenate
                    # the first line of file 2 on the end of the last line
                    # of file 1, which may not be valid.
                    writer.write(contents + "\n")
                    if ((not self.opts.nocomments) and
                            ((not arguments) or
                             (not arguments.nocomments))):
                        writer.write("/********************   End " +
                            infile.ljust(30) + " ********************/\n")
                        writer.write("\n")
                finally:
                    infileobj.close()
        finally:
            writer.flush()
            writer.close()
        if ((not self.opts.nolint) and
                ((not arguments) or
                 (not arguments.nolint)) and
                (filetype == "JS")):
            # To make this faster in the "normal" (no error) case, we
            # first run lint on the merged output.
            lintopts = None
            if arguments and arguments.lintopts:
                lintopts = arguments.lintopts.strip()
            allcomplaints = self.jslint(outfile, lintopts)
            if len(allcomplaints):
                # If there were complaints, run lint on each file until
                # we find them all (since it's much more handy to have the
                # errors from the specific file with the correct line
                # numbers.
                numcomplaints = 0
                for infile in infiles:
                    complaints = self.jslint(infile, lintopts)
                    for complaint in complaints:
                        self._numerrors += 1
                        numcomplaints += 1
                        self.displayerror(filename=infile,
                                line=complaint.linenum,
                                column=complaint.colnum, code="JsLint",
                                message=complaint.complaint)
                    # If we've found all the complaints, we don't need to
                    # bother to run lint on the remaining files.
                    if numcomplaints == len(allcomplaints):
                        break
        if ((not self.opts.nocssimages) and
                ((not arguments) or
                 (not arguments.nocssimages)) and
                (filetype == "CSS")):
            # Note: the output file name could have a subdirectory
            # specified in it.
            self.copyallimages(os.path.dirname(outfile), images_by_infile)

    def jslint(self, filename, lintopts=None):
        """
        This runs JsLint on the specified file, and returns a list of complaints.
    
        lintopts -- Optional (pun intended) JSON string of JSLint options.
                    Full list of options here:
                    http://www.jslint.com/lint.html#options
        filename -- File to lint.
        returns -- A list of complaints.  The JSLint output will be parsed into
                   individual complaints.

        """
        self.displayinfo("Running JsLint against " + filename)
        filehandle = open(filename, "r")
        javascript = filehandle.read()
        filehandle.close()
        if len(self.opts.lintopts.strip()):
            lintopts = self.opts.lintopts
        if lintopts:
            javascript += " --options " + lintopts

        procargs = None
        if self._use_wscript:
            # Windows Script Host has two versions, wscript.exe which pops up
            # a window and cscript.exe which does not.
            procargs = ["cscript.exe", "//I", "//Nologo", self._jslintfile]
        else:
            procargs = ["java", "-jar", self._rhinofile, self._jslintfile]
        try:
            proc = subprocess.Popen(procargs, -1, None, subprocess.PIPE,
                subprocess.PIPE, subprocess.PIPE)
            proc_output = proc.communicate(javascript)
        except Exception as e:
            self.displayerror(message=
                "Error while running JsLint via Rhino.  Is java in your path?",
                e=e)
            sys.exit(-40)
        # 0 = no problems, 1 = lint errors, anything else is presumably a
        # problem running it.
        if (proc.returncode != 0) and (proc.returncode != 1):
            self.displayerror(
                message="JsLint (via Rhino) had non-zero exit code: " +
                str(proc.returncode) + "\n    " + str(procargs) +
                "\n    output: \n\n" + str(proc_output), code=proc.returncode)
            sys.exit(-19)
        retval = []
        for complaint in proc_output[0].split("Lint at "):
            if len(complaint.strip()):
                retval.append(JsLintComplaint(complaint))
        return retval

    def extractpaths(self, cssfile, contents):
        """
        Searches the contents of a CSS file for any image files, and
        returns a list of the paths (relative to the CSS file's location).

        cssfile -- Name of the CSS file we're looking at, used for logging.
        contents -- Contents of the CSS file.
        returns -- A dictionary of everything that appears to be an image file.
                   Key: path relative to the CSS file, Value: Absolute path.

        """
        img_start = "URL("
        img_end = ")"
        img_start_len = len(img_start)
        img_end_len = len(img_end)

        # Since images in CSS are relative to the file, we need
        # the directory the file was in.
        cssdir = os.path.dirname(cssfile)

        # Store the names in a dictionary to prevent duplicates.
        # This is the real path keyed by the CSS relative path.
        retval = {}
        # We do a really simple check.  Find everything between open and
        # close parends, and see if it exists.  If it does, include it.
        lintnum = 0
        eol_idx = 0
        # This toupper is because the openstr contains upper case chars.  The
        # indexes however will still be comparable to the original string (in
        # English anyway)
        contents_upper = contents.upper()
        startidx = contents_upper.find(img_start)
        endidx = (contents.find(img_end, startidx+img_start_len) if
                  (startidx >= 0) else -1)
        while (startidx >= 0) and (endidx > startidx):
            possiblepath = contents[startidx + img_start_len: endidx]
            # Remove any whitespace or quotes.
            possiblepath = possiblepath.strip()
            possiblepath = possiblepath.strip("'\"")
            possiblepath = possiblepath.strip()

            wasfile = True
            # No point in checking for the file if we already have it.
            if not retval.has_key(possiblepath):
                realpath = os.path.join(cssdir, possiblepath)
                if (os.path.exists(realpath) and
                        os.path.isfile(realpath)):
                    retval[possiblepath] = realpath
                else:
                    while ((eol_idx <= startidx) and (eol_idx != -1)):
                        lintnum += 1
                        eol_idx = contents.find('\n', eol_idx + 1)
                    self.displaywarning(
                        "Minifier can't find the file for this url " +
                        "referenced in the CSS: \n    " + possiblepath +
                        "\nThat should be: \n    " + realpath,
                        cssfile, lintnum)
                    self._numwarnings += 1
                    wasfile = False
            # Search for the next pair of open/close, plus at least 1 for the
            # file name.
            minchars = (img_start_len + img_end_len + 1)
            if startidx < (len(contents) - minchars):
                # If it was a file, we can skip the whole thing.
                startidx = contents_upper.find(img_start,
                    (endidx if wasfile else startidx) + 1)
            else:
                startidx = -1
            if ((startidx >= 0) and
                    (startidx < (len(contents) - minchars))):
                endidx = contents.find(img_end, startidx +
                             img_start_len)
            else:
                endidx = -1
        return retval

    def copyallimages(self, outdir, images_by_infile):
        """
        Copies all the images used by the input CSS files

        outdir -- Path to the directory with the output CSS file, since
                       image paths in CSS are relative to the file.
        images_by_infile -- Images paths.
                           Key: input file name from the config (used for error
                                messages)
                           Value: dictionary of
                               Key: file path relative to the CSS.
                               Value: Real file path where we can get the
                                      file from.
 
        """
        source_by_dest = {}
        for infile in images_by_infile:
            images = images_by_infile[infile]
            self.displayinfo("    Copying files for " + infile + ":")
            for relativepath in images:
                sourcefile = images[relativepath]
                destfile = os.path.join(outdir, relativepath)
                # This is to make sure "../file" and "/blah/blah/blah/file"
                # don't happen to be referring to the same file.
                if os.path.abspath(sourcefile) == os.path.abspath(destfile):
                    self.displayinfo(
                        "        Not copying file (src and dest are the same): " +
                        destfile)
                else:
                    # Make sure the subdirectories exist.
                    self.ensuredirexists(destfile)

                    # If we're copying over the same file from a different
                    # source, raise a warning.  If it's the same source,
                    # skip it.
                    docopy = True
                    if source_by_dest.has_key(destfile):
                        if source_by_dest[destfile] != sourcefile:
                            self.displaywarning(
                                "Warning: Overwriting file '" + destfile +
                                        "' originally written for " +
                                        source_by_dest[destfile],
                                destfile)
                            self._numwarnings += 1
                        else:
                            docopy = False
                    if docopy:
                        self.displayinfo("        Copying: " + destfile)
                        shutil.copyfile(sourcefile, destfile)
                        source_by_dest[destfile] = sourcefile
                    else:
                        self.displayinfo("        Not copying file (already copied): " +
                            destfile)

    def displaydirections(self):
        """ Dumps the directions on how to run this program to the console."""
        self.parser.print_help()

    def displayinfo(self, message):
        "Displays an info message only if verbose mode is set."
        if self.opts.verbose:
            print message

    def displaywarning(self, msg, filename=None, line=None):
        "Dumps a nicely formatted warning message."
        self.displayvsmessage(filename, line, -1, False, None, msg)

    def displayerror(self, message, filename=None, line=None, column=None,
                      code=None, e=None):
        "Dumps a nicely formatted error message."
        s = message
        if e: s += "\n%s\n%s" % (e.__str__(), traceback.format_exc())
        self.displayvsmessage(filename, line, column, True, code, s)

    def displayvsmessage(self, filename, line, column, error, code, message):
        """
        Dumps an error or warning message formatted so Visual Studio will
        pick it up.
        """
        output = ""
        if filename:
            output += filename
            if line >= 0:
                output += "(" + str(line)
                if column >= 0:
                    output += "," + str(column)
                output += ")"
        else:
            output += "Minifier"
        output += ": "
        output += "error" if error else "warning"
        if code:
            output += " " + str(code)
        output += " : " + message
        print 
        print output
        print 

    def minify(self, filename, arguments=None):
        """
        Takes a filename ("filename.extension") to minify and produces a
        minified version ("filename-min.extension").

        filename -- The file to minify.  Currently only JS and CSS files are
                    supported (we use the YUI compressor).
        arguments -- Any command line or sectional arguments.

        """
        ext_idx = filename.rfind('.')
        if ext_idx < 0:
            self.displayerror(filename=filename, message="Output file name " +
                filename + " does not have a valid extension.")
            self.displaydirections()
            sys.exit(-18)

        minfilename = filename[0: ext_idx]+ "-min" + filename[ext_idx:]
        # Optimization: First check if the input file is older than the
        # minified file, nothing has changed and no need to do anything.
        dominify = ((self.opts.force or
                (arguments and arguments.force)) or
                not (os.path.exists(minfilename) and
                     os.path.isfile(minfilename)))
        if not dominify:
            outfilemtime = os.path.getmtime(minfilename)
            if self._configmtime > outfilemtime:
                # Config was modified more recently than our output,
                # contents may have changed.
                dominify = True
            else:
                if not (os.path.exists(filename) and os.path.isfile(filename)):
                    self.displayerror(filename=filename, message="File " +
                        filename + " does not exist.")
                    self.displaydirections()
                    sys.exit(-31)
                else:
                    infilemtime = os.path.getmtime(filename)
                    if infilemtime > outfilemtime:
                        # Input is newer, need to do something.
                        dominify = True
        if not dominify:
            self.displayinfo("Skipping " + minfilename +
                  " because it appears up-to-date.  Use --force to override.")
        else:
            self.displayinfo("Minifying " + filename + "...")
            procargs = ["java", "-jar", self._compressorfile, filename]
            output = None
            try:
                proc = subprocess.Popen(procargs, stdout=subprocess.PIPE,
                                        stderr=subprocess.PIPE)
                output = proc.communicate()
                if proc.returncode != 0:
                    self.displayerror(message=
                        "Compressor had non-zero exit code: " +
                        str(proc.returncode) + "\n    " + str(procargs) +
                        "\n    " + output[1], code=proc.returncode)
                    sys.exit(-19)
            except Exception as e:
                self.displayerror(message=
                    "Error while running compressor.  Is java in your path?",
                    e=e)
                sys.exit(-41)

            outfileobj = open(minfilename, "w")
            try:
                outfileobj.write(output[0])
            except Exception as e:
                self.displayerror(message=
                    "Error while writing compressed output.", e=e)
                sys.exit(-42)
            finally:
                outfileobj.flush()
                outfileobj.close()
            self.displayinfo("  > " + minfilename)


    def ensuredirexists(self, filename):
        """ For a given file name, ensures the directory for that file exists."""
        dirname = os.path.dirname(filename)
        if not (os.path.exists(dirname) and os.path.isdir(dirname)):
            try:
                os.makedirs(dirname)
            except Exception as e:
                self.displayerror(filename=dirname, message="Output dir " +
                    dirname + " does not exist and could not be created.", e=e)
                self.displaydirections()
                sys.exit(-20)

        
    def copydir(self, fromdir, todir):
        """
        Recursively copies all the contents of one directory to another directory.

        fromdir -- The source.
        todir -- The destination.
        returns -- The number of files/subdirectories copied.

        """
        try:
            retval = 0
            # Since this recursively does subdirs, need to make sure
            # they exist as we go.
            self.ensuredirexists(todir + os.sep + "junk.file")
            for f in os.listdir(fromdir):
                if os.path.isfile(os.path.join(thedir, f)):
                    shutil.copyfile(f, todir + f[len(fromdir):])
                    retval += 1
            for d in os.listdir(fromdir):
                if os.path.isdir(os.path.join(thedir, d)):
                    # Ignore any svn or git dirs.
                    if re.match("([\._][Ss][Vv][Nn]|\.git)",
                                os.path.basename(d)):
                        # Add the number of files copied.
                        retval += self.copydir(d, todir + d[len(fromdir):])
                        # Add one more for the directory itself.
                        retval += 1
            return retval
        except Exception as e:
            raise Exception("Unable to copy from dir " + fromdir + " to dir " +
                            todir + ".", e)


class JsLintComplaint(object):
    def __init__(self, complaint):
        lines = complaint.split('\n')
        m = re.search("line ([0-9]*) character ([0-9]*):(.*)", lines[0])
        if m:
            self.complaint = m.group(2).strip()
            for line in lines:
                self.complaint += "\n" + line
            if len(self.complaint.strip()):
                try:
                    self.linenum = int(m.group(0))
                except:
                    self.linenum = -1
                try:
                    self.colnum = int(m.group(1))
                except:
                    self.colnum = -1
            else:
                self.linenum = -1
                self.colnum = -1
                self.complaint = complaint
        else:
            self.linenum = -1
            self.colnum = -1
            self.complaint = complaint

    
# Trim off the first arg, which is the name of the python file.
Minifier().run(sys.argv[1:])
