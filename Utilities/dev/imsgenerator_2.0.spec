# -*- mode: python -*-

block_cipher = None


a = Analysis(['imsgenerator_2.0.py'],
             pathex=['C:\\Users\\eric_\\Desktop\\E DRIVE\\Git\\ml_scorm\\Utilities\\dev'],
             binaries=[],
             datas=[('C:\\Users\\eric_\\Desktop\\E DRIVE\\Git\\ml_scorm\\Utilities\\dev\\Watermelon16.ico', 'data')],
             hiddenimports=[],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name='imsgenerator_2.00',
          debug=False,
          strip=False,
          upx=True,
          console=False , icon='WatermelonStack.ico')
