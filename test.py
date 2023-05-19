import os
from alive_progress import alive_bar
from termcolor import colored, cprint
from utils import duplicate, logs, structures, timestamp

_path = "E:\\Kai\\botInstagram\\pics_new"
all_folders = structures.get_folders(_path)
for idx, profile in enumerate(all_folders):
    logs.debug(f"{idx+1}/{len(all_folders)} Checking {profile}")
    profile_path = os.path.join(_path, profile)
    duplicates = duplicate.find_duplicate_files_by_hash(profile_path)
    for idx, file_list in enumerate(duplicates):
        files = duplicate.get_copy_files(file_list)
        duplicate.delete_files(files)
        files = duplicate.get_newer_files(file_list)
        duplicate.delete_files(files)
