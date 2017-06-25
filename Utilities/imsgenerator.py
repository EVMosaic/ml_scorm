# a simple tool to generate some formatted text based on file structure
from os import walk
from os.path import isfile, dirname, realpath

class MosaicXmlGenerator(object):
    def __init__(self, current_directory):
        self.current_directory = current_directory

    def generate(self):
        for (dirpath, dirnames, filenames) in walk(self.current_directory):
            #Got at least one file in this directory
            if len(filenames):
                for filename in filenames:
                    if not isfile(dirpath + '/' + filename):
                        continue
                    if filename == 'generate.py': #exclude this script itself
                        continue
                    self.print_file_row(dirpath, filename)

    def print_file_row(self, dirpath, filename):
        print('<file href="' + self.trim_file_path(dirpath) + '/' + filename + '" />')

    def trim_file_path(self, dirpath):
        return dirpath[len(self.current_directory):].replace('\\', '/')

if __name__ == '__main__':
    generator = MosaicXmlGenerator(dirname(realpath(__file__)))
    generator.generate()