import base64
import os
import shutil
import tkinter
import tkinter.filedialog as filedialog

import eel
from alive_progress import alive_bar
from termcolor import colored, cprint

from utils import duplicate, logs, structures, timestamp

# Set web files folder and optionally specify which file types to check for eel.expose()
#   *Default allowed_extensions are: ['.js', '.html', '.txt', '.htm', '.xhtml']

try:
    eel.init('web')

    LAST_SCAN_RESULT = {}

    @eel.expose
    def select_folder(type):
        logs.debug("select_folder")
        root = tkinter.Tk()
        root.attributes("-topmost", True)
        root.withdraw()
        directory_path = filedialog.askdirectory()
        print(directory_path)
        eel.showSelectedFolder(type, directory_path)

    @eel.expose
    def run(sourceFolder, targetFolder):
        global LAST_SCAN_RESULT
        logs.debug("run")
        print("Source Folder:", colored(sourceFolder, "yellow"))
        print("Target Folder:", colored(targetFolder, "yellow"))
        eel.updateProgress(0)
        if sourceFolder == "":
            print("Run only target")
            eel.showLogs(f"Checking {targetFolder}")
            duplicates = duplicate.find_duplicate_files_by_hash(
                targetFolder, message_callback=eel.showLogs, update_callback=eel.updateProgress)
            LAST_SCAN_RESULT = {"type": "target", "results": duplicates}

        else:
            print("Run source target")
            eel.showLogs(f"Checking {sourceFolder} | {targetFolder}")
            duplicates = duplicate.find_duplicate_files_by_hash_source_target(sourceFolder,
                                                                              targetFolder, message_callback=eel.showLogs, update_callback=eel.updateProgress)
            LAST_SCAN_RESULT = {"type": "source-target", "results": duplicates}
        results = []
        with alive_bar(len(duplicates)) as bar:
            for file_list in duplicates:
                bar()
                _temp_data = []
                for _file in file_list:
                    cprint(_file, "cyan")
                    _temp_data.append({
                        "path": _file,
                        "size": structures.get_filesize(_file),
                        "create": timestamp.get_create_time_file(_file),
                        "type": structures.get_file_type(_file)
                    })
                results.append(_temp_data)
                print()
        # print(results)
        print("Found", colored(len(duplicates), "yellow"), "duplicate files")
        eel.showResults(results)
        eel.showLogs(f"Found {len(duplicates)} duplicate files")
        eel.done()

    @eel.expose
    def stop():
        logs.debug("stop")
        # TODO: stop program

    @eel.expose()
    def show_media_from_base64(file_path):
        if not os.path.exists(file_path):
            return False
        logs.debug(f"Show media with base64: {file_path}")
        # Read the image file content as bytes
        filename = os.path.splitext(file_path)[0]
        file_type = structures.get_file_type(file_path)
        if file_type != "unknown":
            print(filename, file_type)
            with open(file_path, 'rb') as f:
                data = f.read()
            # Encode the image data as a base64 string
            base64_str = base64.b64encode(data).decode('utf-8')

            # Create an HTML img element with the base64-encoded data
            if file_type == "image":
                img_src = f'data:image/png;base64,{base64_str}'
                html = f'<img src="{img_src}" />'
            elif file_type == "video":
                video_src = f'data:video/mp4;base64,{base64_str}'
                html = f'<video src="{video_src}" controls></video>'
            elif file_type == "audio":
                audio_src = f'data:audio/mpeg;base64,{base64_str}'
                html = f'<audio src="{audio_src}" controls></audio>'

            html += f"<p>{filename}</p>"
            # Show the HTML in the Eel app
            eel.showContent(html)

    @eel.expose()
    def delete_selected(data):
        _temp_deleted_files = []
        for idx, _file in enumerate(data["files"]):
            message = f"{idx+1}/{len(data['files'])} delete {_file}"
            percent = round((idx+1) / len(data["files"])*100)
            eel.updateProgress(percent)
            eel.showLogs(message)
            if not os.path.exists(_file):
                continue
            if data["type"] == "delete":
                os.remove(_file)
                _temp_deleted_files.append(_file)
            elif data["type"] == "move":
                try:
                    shutil.move(_file, data["folder"])
                    logs.error(_file)
                    _temp_deleted_files.append(_file)
                except:
                    count = 0
                    filename = os.path.splitext(os.path.basename(_file))[0]
                    extension = os.path.splitext(os.path.basename(_file))[1]

                    while True:
                        file_path = os.path.join(
                            data["folder"], filename+"_"+str(count).zfill(5)+extension)
                        if os.path.exists(file_path):
                            count += 1
                        else:
                            break
                    shutil.move(_file, file_path)
                    logs.error(_file)
                    _temp_deleted_files.append(_file)
        eel.updateProgress(100)
        eel.updateResults(_temp_deleted_files)
        eel.showLogs(f"Deleted {len(_temp_deleted_files)} files")
        eel.done()

    @eel.expose()
    def delete_auto(data):
        global LAST_SCAN_RESULT
        duplicates = LAST_SCAN_RESULT["results"]
        _updated_duplicates = []
        if LAST_SCAN_RESULT["type"] == "target":
            for file_list in duplicates:
                length = len(file_list)
                for _file in file_list:
                    if not os.path.exists(_file):
                        length -= 1
                if length >= 2:
                    _updated_duplicates.append(file_list)
            _temp_deleted_files = []
            for idx, file_list in enumerate(_updated_duplicates):
                percent = round((idx+1) / len(_updated_duplicates)*100)
                eel.updateProgress(percent)
                for _file in file_list:
                    cprint(_file, "cyan")
                if data["delete-copy"]:
                    files = duplicate.get_copy_files(file_list)
                    if data["type"] == "move":
                        _deleted_files = duplicate.move_files(
                            files, data["folder"])
                    else:
                        _deleted_files = duplicate.delete_files(files)
                    _temp_deleted_files += _deleted_files
                    for i in _deleted_files:
                        eel.showLogs(f"{data['type']} {i}")
                if data["delete-newer"]:
                    files = duplicate.get_newer_files(file_list)
                    if data["type"] == "move":
                        _deleted_files = duplicate.move_files(
                            files, data["folder"])
                    else:
                        _deleted_files = duplicate.delete_files(files)
                    _temp_deleted_files += _deleted_files
                    for i in _deleted_files:
                        eel.showLogs(f"{data['type']} {i}")
        if LAST_SCAN_RESULT["type"] == "source-target":
            _temp_deleted_files = []
            for idx, file_list in enumerate(duplicates):
                percent = round((idx+1) / len(duplicates)*100)
                eel.updateProgress(percent)

                _delete_file_path = file_list[0]

                message = f"{data['type']} {_delete_file_path}"
                eel.showLogs(message)
                logs.error(message)

                _temp_deleted_files.append(_delete_file_path)
                if os.path.exists(_delete_file_path):
                    if data["type"] == "delete":
                        os.remove(_delete_file_path)
                    else:
                        duplicate.move_file(_delete_file_path, data["folder"])

        eel.updateProgress(100)
        eel.showLogs(f"{data['type']} {len(_temp_deleted_files)} files")
        eel.updateResults(_temp_deleted_files)
        eel.done()

    eel.start('index.html', size=(850, 850),
              resizable=False, position='center')
except Exception as e:
    with open("error.log", 'a') as fa:
        fa.write(str(e)+"\n")
