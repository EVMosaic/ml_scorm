import os
import tkinter
from tkinter import filedialog

from tkinter import Entry, Label, Button, Grid

test = ''

def set_project_root():
    opts = {'parent': root,
            'title': 'Select SCORM Project Root',
            'initialdir': 'C:\\Users\\eric_\\Desktop\\'}

    project_root = os.path.abspath(filedialog.askdirectory(**opts))
    global test
    test = project_root
    project_path_entry.insert(0,project_root)

def generate():
    global test
    unit_title = unit_title_entry.get()
    lesson_title = lesson_title_entry.get()
    version = version_entry.get()
    identifier = identifier_entry.get()
    print("unit: " + unit_title)
    print("lesson: " + lesson_title)
    print("version: " + version)
    print("identifier: " + identifier)
    testpath = os.path.join(test, 'test.txt')
    print(testpath)

    with open(testpath, 'w', encoding='utf8') as new_file:
        for x in range(10):
            new_file.write(str(x))
            new_file.write('\n')

root = tkinter.Tk()
root.minsize(300,100)
root.resizable(True,False)
root.lift()

Grid.columnconfigure(root, 0, weight=0, pad=10)
Grid.columnconfigure(root, 1, weight=1, pad=10)
Grid.rowconfigure(root, 0, pad=5)

bg_color = "#%02x%02x%02x" % (249, 130, 148)
button_color = "#f0236b"
text_box_color = "#7cffac"
bg_color = "#f98294"

root['bg'] = bg_color

project_path_entry = Entry(root, background=text_box_color)
unit_title_entry = Entry(root, background=text_box_color)
lesson_title_entry = Entry(root, background=text_box_color)
version_entry = Entry(root, background=text_box_color)
identifier_entry = Entry(root, background=text_box_color)

unit_title_entry.insert(0, "Unit 1")
lesson_title_entry.insert(0, "Lesson 1")
version_entry.insert(0,1)
identifier_entry.insert(0, "com.mosaiclearning.client.project")

project_root_button = Button(root, text='Select Project Root', command=set_project_root, background=button_color, foreground="white")
generate_button = Button(root, text="Generate", command=generate, background=button_color, foreground="white")

unit_label = Label(root, text="Unit Title:", background=bg_color)
lesson_label = Label(root, text="Lesson Title:", background=bg_color)
version_label = Label(root, text="Version:", background=bg_color)
identifier_label = Label(root, text="Identifier:", background=bg_color)

xpad = 5
ypad = 3

project_root_button.grid(row=0, column=0, columnspan=2, sticky="ew", padx=xpad, pady=0)
project_path_entry.grid(row=1, column=0, columnspan=2, sticky="ew", padx=xpad, pady=1)
unit_title_entry.grid(row=2, column=1, sticky="ew", padx=xpad, pady=ypad)
unit_label.grid(row=2, column=0, sticky="e", padx=xpad, pady=ypad)
lesson_title_entry.grid(row=3, column=1, sticky="ew", padx=xpad, pady=ypad)
lesson_label.grid(row=3, column=0, sticky="e", padx=xpad, pady=ypad)
version_entry.grid(row=4, column=1, sticky="ew", padx=xpad, pady=ypad)
version_label.grid(row=4, column=0, sticky="e", padx=xpad, pady=ypad)
identifier_entry.grid(row=5, column=1, sticky="ew", padx=xpad, pady=ypad)
identifier_label.grid(row=5, column=0, sticky="e", padx=xpad, pady=ypad)
generate_button.grid(row=6, columnspan=2, sticky="ew", padx=xpad, pady=ypad)

root.mainloop()
