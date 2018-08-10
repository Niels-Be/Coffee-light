
HAT           = (8,8)
PHAT_VERTICAL = (4,8)
PHAT          = (8,4)
AUTO          = None

_pixels = None

def set_layout(pixel_map = AUTO):
    global _pixels
    if pixel_map == AUTO:
        raise ValueError('unimog does not support set_layout(AUTO)')

    _pixels = []
    for i in range(pixel_map[0]):
       _pixels.append([(0,0,0)] * pixel_map[1])


def rotation(r=0):
   pass


def brightness(b=0.2):
    if b > 1 or b < 0:
        raise ValueError('Brightness must be between 0.0 and 1.0')


def set_pixel(x, y, r, g=None, b=None):
    global _pixels
    if type(r) is tuple:
        r, g, b = r

    _pixels[x][y] = (r,g,b)


def show():
    global _pixels
    for x in range(len(_pixels)):
        for y in range(len(_pixels[x]) - 1, -1, -1):
            print("\x1b[38;2;%d;%d;%dm█\x1b[0m" % _pixels[x][y], end='')
        print()

    print()


def clear():
    for x in range(len(_pixels)):
        for y in range(len(_pixels[x])):
            _pixels[x][y] = (0, 0, 0)


def off():
    clear()
    show()
