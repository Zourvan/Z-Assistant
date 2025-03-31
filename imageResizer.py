import os
import imageio
from PIL import Image


def clean_filename(filename):
    """
    حذف فضای خالی و پرانتز باز و بسته از نام فایل
    """
    filename = filename.replace(' ', '')
    filename = filename.replace('(', '')
    filename = filename.replace(')', '')
    return filename


def delete_thumb_files(folder_path):
    """
    حذف فایل‌هایی که نامشان با '_thumb' ختم می‌شوند.
    Args:
        folder_path (str): مسیر پوشه
    """
    try:
        for filename in os.listdir(folder_path):
            if '_thumb' in filename:  # چک کردن اگر _thumb در نام فایل باشد
                file_path = os.path.join(folder_path, filename)
                os.remove(file_path)  # حذف فایل
                print(f"Deleted: {file_path}")
    except Exception as e:
        print(f"Error deleting files: {e}")


def resize_gif(img_path, new_file_path, scale_factor):
    """
    تغییر اندازه فایل GIF با استفاده از imageio و PIL.

    Args:
        img_path (str): مسیر فایل GIF.
        new_file_path (str): مسیر فایل GIF جدید برای ذخیره.
        scale_factor (float): ضریب تغییر اندازه.
    """
    try:
        # استفاده از get_reader برای خواندن GIF
        reader = imageio.get_reader(img_path)
        resized_frames = []

        for frame in reader:
            try:
                img = Image.fromarray(frame)
                img = img.convert('RGB')  # تبدیل به RGB
                
                # تغییر اندازه
                new_dimensions = (int(img.width * scale_factor), int(img.height * scale_factor))
                resized_frame = img.resize(new_dimensions, Image.LANCZOS)
                resized_frames.append(resized_frame)
            except Exception as e:
                print(f"Error processing frame: {e}")
                continue  # رد کردن این فریم و ادامه پردازش فریم‌های دیگر

        # ذخیره GIF بازسازی‌شده
        imageio.mimsave(new_file_path, [frame for frame in resized_frames], duration=0.1)
        print(f"Resized and saved GIF: {new_file_path}")

    except Exception as e:
        print(f"Error resizing GIF {img_path}: {e}")


def resize_images_in_folder(folder_path, scale_factor=0.25):
    """
    تغییر اندازه تصاویر موجود در یک پوشه و ذخیره نسخه کوچک شده آنها.

    Args:
        folder_path (str): مسیر پوشه حاوی تصاویر.
        scale_factor (float): ضریب تغییر اندازه تصاویر.
    """
    image_formats = {
        'png': [],
        'jpg': [],
        'jpeg': [],
        'gif': []
    }

    # حذف فایل‌های _thumb
    delete_thumb_files(folder_path)

    # لیست کردن، تغییر نام فایل‌ها و دسته‌بندی فایل‌ها
    for filename in os.listdir(folder_path):
        try:
            cleaned_filename = clean_filename(filename)
            old_file_path = os.path.join(folder_path, filename)
            new_file_path = os.path.join(folder_path, cleaned_filename)

            # تغییر نام فایل (حذف فضای خالی و پرانتزها)
            if old_file_path != new_file_path:
                os.rename(old_file_path, new_file_path)

            file_extension = cleaned_filename.split('.')[-1].lower()
            if file_extension in image_formats:
                image_formats[file_extension].append(cleaned_filename)
        except Exception as e:
            print(f"Error processing file {filename}: {e}")

    # ذخیره لیست فایل‌ها در فایل متنی
    try:
        with open(os.path.join(folder_path, 'image_list.txt'), 'w') as f:
            for format, files in image_formats.items():
                f.write(f"Format: {format}\n")
                for file in files:
                    f.write(f"- {file}\n")
                f.write("\n")
    except Exception as e:
        print(f"Error writing image list: {e}")

    # ریسایز تصاویر
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            # مسیر کامل فایل تصویر
            img_path = os.path.join(folder_path, filename)

            # ایجاد نام جدید با suffix "thumb"
            name, ext = os.path.splitext(filename)
            new_filename = f"{name}_thumb{ext}"
            new_file_path = os.path.join(folder_path, new_filename)

            try:
                if filename.lower().endswith('.gif'):
                    # ریسایز GIF
                    resize_gif(img_path, new_file_path, scale_factor)
                else:
                    # باز کردن تصویر
                    with Image.open(img_path) as img:
                        # محاسبه اندازه جدید
                        new_dimensions = (int(img.width * scale_factor), int(img.height * scale_factor))
                        
                        # تغییر اندازه تصویر
                        img = img.resize(new_dimensions)
                        
                        # ذخیره تصویر جدید
                        img.save(new_file_path)
                        print(f"Resized and saved: {new_file_path}")

            except Exception as e:
                print(f"Error resizing image {filename}: {e}")


# مسیر پوشه خود را اینجا قرار دهید
folder_path = 'D:\\MD\\Project\\Z-Assistant\\static\\background\\'
resize_images_in_folder(folder_path)
print(f"Done! Check the folder: {folder_path}")
