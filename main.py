import argparse
import os
import shutil

from alive_progress import alive_bar
from termcolor import colored, cprint

from utils import duplicate, logs, structures

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("-t", "--target", help="Folder target")
    parser.add_argument("-f", "--folder", help="Folder targets")
    parser.add_argument("-s", "--source", help="Folder source")
    parser.add_argument("-m", "--move", help="Folder move")
    parser.add_argument(
        "-d", "--delete", help="Delete files",  action='store_true')
    parser.add_argument("--test", help="Folder source",  action='store_true')
    args = parser.parse_args()

    print(args.source, args.target, args.move)

    delete = False

    if args.move:
        if not os.path.exists(args.move):
            logs.error(f"{args.move} is not existed")
    if args.delete:
        delete = True

    if args.source != None and args.target != None:
        duplicate.find_duplicate_files_by_source_target(
            args.source, args.target, args.move, delete)
    elif args.target != None:
        duplicate.find_duplicate_files_by_target(
            args.target, args.move, delete)

    if args.folder:
        duplicate.find_duplicate_files_by_folders_in_target(
            args.folder, args.move, delete)
