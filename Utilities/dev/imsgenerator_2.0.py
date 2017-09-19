# a simple tool to generate some formatted text based on file structure
import os
import sys
from os import walk
from os.path import isfile, join, abspath
import tkinter
from tkinter import filedialog
from tkinter import Entry, Label, Button, Grid


class Application:
    def __init__(self):
        self.unit_title = ""
        self.lesson_title = ""
        self.version = ""
        self.identifier = ""
        self.project_root = ""
        self.build_gui()
        self.root.mainloop()

    def set_project_root(self):
        opts = {'parent': self.root,
                'title': 'Select SCORM Project Root',
                'initialdir': 'C:/'}

        self.project_root = abspath(filedialog.askdirectory(**opts))
        self.project_path_entry.insert(0, self.project_root)
        self.generate_button['bg'] = "#f0236b"
        self.generate_button['text'] = "Generate"
        self.generate_button['fg'] = "white"

    def generate(self):
        unit_title = self.unit_title_entry.get()
        lesson_title = self.lesson_title_entry.get()
        version = self.version_entry.get()
        identifier = self.identifier_entry.get()
        file_path = os.path.join(self.project_root, 'imsmanifest.xml')
        with open(file_path, 'w', encoding='utf8') as new_file:
            generator = MosaicXmlGenerator(new_file)
            generator.make_intro(identifier, version, unit_title, lesson_title)
            generator.make_resources()
            self.generate_button['bg'] = "#7cffac"
            self.generate_button['text'] = "Manifest Generated!"
            self.generate_button['fg'] = "black"

    def resource_path(self, relative_path):
        """ Get absolute path to resource, works for dev and for PyInstaller """
        try:
            # PyInstaller creates a temp folder and stores path in _MEIPASS,
            # and places our data files in a folder relative to that temp
            # folder named as specified in the datas tuple in the spec file
            base_path = os.path.join(sys._MEIPASS, 'data')
        except Exception:
            # sys._MEIPASS is not defined, so use the original path
            base_path = ''

        return os.path.join(base_path, relative_path)
    def build_gui(self):

        self.root = tkinter.Tk()
        self.root.iconbitmap(self.resource_path('.\\Watermelon16.ico'))
        self.root.wm_title("IMS Manifest Generator")
        self.root.minsize(300, 100)
        self.root.resizable(True, False)
        self.root.lift()

        Grid.columnconfigure(self.root, 0, weight=0, pad=10)
        Grid.columnconfigure(self.root, 1, weight=1, pad=10)
        Grid.rowconfigure(self.root, 0, pad=5)

        button_color = "#f0236b"
        text_box_color = "#7cffac"
        bg_color = "#f98294"

        self.root['bg'] = bg_color

        self.project_path_entry = Entry(self.root, background=text_box_color)
        self.unit_title_entry = Entry(self.root, background=text_box_color)
        self.lesson_title_entry = Entry(self.root, background=text_box_color)
        self.version_entry = Entry(self.root, background=text_box_color)
        self.identifier_entry = Entry(self.root, background=text_box_color)

        self.unit_title_entry.insert(0, "Unit 1")
        self.lesson_title_entry.insert(0, "Lesson 1")
        self.version_entry.insert(0, 1)
        self.identifier_entry.insert(0, "com.mosaiclearning.client.project")

        self.project_root_button = Button(self.root, text='Select Project Root', command=self.set_project_root,
                                          background=button_color, foreground="white")
        self.generate_button = Button(self.root, text="Generate", command=self.generate, background=button_color,
                                      foreground="white")

        self.unit_label = Label(self.root, text="Unit Title:", background=bg_color)
        self.lesson_label = Label(self.root, text="Lesson Title:", background=bg_color)
        self.version_label = Label(self.root, text="Version:", background=bg_color)
        self.identifier_label = Label(self.root, text="Identifier:", background=bg_color)

        xpad = 5
        ypad = 3

        self.project_root_button.grid(row=0, column=0, columnspan=2, sticky="ew", padx=xpad, pady=0)
        self.project_path_entry.grid(row=1, column=0, columnspan=2, sticky="ew", padx=xpad, pady=1)
        self.unit_title_entry.grid(row=2, column=1, sticky="ew", padx=xpad, pady=ypad)
        self.unit_label.grid(row=2, column=0, sticky="e", padx=xpad, pady=ypad)
        self.lesson_title_entry.grid(row=3, column=1, sticky="ew", padx=xpad, pady=ypad)
        self.lesson_label.grid(row=3, column=0, sticky="e", padx=xpad, pady=ypad)
        self.version_entry.grid(row=4, column=1, sticky="ew", padx=xpad, pady=ypad)
        self.version_label.grid(row=4, column=0, sticky="e", padx=xpad, pady=ypad)
        self.identifier_entry.grid(row=5, column=1, sticky="ew", padx=xpad, pady=ypad)
        self.identifier_label.grid(row=5, column=0, sticky="e", padx=xpad, pady=ypad)
        self.generate_button.grid(row=6, columnspan=2, sticky="ew", padx=xpad, pady=ypad)




class MosaicXmlGenerator(object):
    def __init__(self, openfile):
        self.filetext = ''
        self.root_directory = os.path.split(openfile.name)[0]
        self.file = openfile

    def make_intro(self, identifier, version, unit, lesson):
        self.file.write('''<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<manifest identifier="''' + identifier + '''" version="''' + version + '''"
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
        <title>''' + unit + '''</title>
        <item identifier="item_1" identifierref="resource_1">
            <title>''' + lesson + '''</title>
        </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">''')
        self.file.write('\n')

    def make_resources(self):
        for (dirpath, dirnames, filenames) in walk(self.root_directory):
            # Got at least one file in this directory
            if len(filenames):
                for filename in filenames:
                    if not isfile(dirpath + '/' + filename):
                        continue
                    if filename == 'imsgenerator.py':  # exclude this script itself
                        continue
                    self.file.write(self.make_file_row(dirpath, filename))
                    self.file.write('\n')

        self.file.write('''    </resource>
  </resources>
</manifest>
''')

    def make_file_row(self, dirpath, filename):
        return '      <file href="' + self.trim_file_path(join(dirpath, filename) + '" />')

    def trim_file_path(self, dirpath):
        return dirpath[len(self.root_directory) + 1:].replace('\\', '/')


if __name__ == '__main__':
    app = Application()
