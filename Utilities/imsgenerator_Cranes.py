# a simple tool to generate some formatted text based on file structure
from os import walk
from os.path import isfile, dirname, realpath
import sys

class MosaicXmlGenerator(object):
    def __init__(self, current_directory, module, lesson):
        self.current_directory = current_directory
        self.moduleNo = str(module)
        self.lessonNo = str(lesson)

    def generate(self):
        print('''<?xml version="1.0" standalone="no" ?>
<manifest identifier="com.scorm.golfsamples.contentpackaging.singlesco.12" version="1"
         xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
         xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                             http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                             http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>

  <organizations default="default_org">
    <organization identifier="default_org">
      <title>Module ''' + self.moduleNo +'''</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>Lesson ''' + self.lessonNo + '''</title>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="/index.html">''')
        for (dirpath, dirnames, filenames) in walk(self.current_directory):
            #Got at least one file in this directory
            if len(filenames):
                for filename in filenames:
                    if not isfile(dirpath + '/' + filename):
                        continue
                    if filename == 'generate.py': #exclude this script itself
                        continue
                    self.print_file_row(dirpath, filename)
        print('''    </resource>
  </resources>
</manifest>
''')

    def print_file_row(self, dirpath, filename):
        print('      <file href="' + self.trim_file_path(dirpath) + '/' + filename + '" />')

    def trim_file_path(self, dirpath):
        return dirpath[len(self.current_directory):].replace('\\', '/')

if __name__ == '__main__':
    generator = MosaicXmlGenerator(dirname(realpath(__file__)), sys.argv[1], sys.argv[2])
    generator.generate()
