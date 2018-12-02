
def get_download(temp_dict, label):
    if label in temp_dict:
        return temp_dict[label]
    else:
        return 0


def get_rec_by_label(temp_dict, label):
    if label in temp_dict:
        return temp_dict[label]
    else:
        return [0, 0, 0]