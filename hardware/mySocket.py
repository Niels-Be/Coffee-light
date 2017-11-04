#!/usr/bin/env python

import logging
import colorsys
import math
import time
import signal
import unicornhat as unicorn
import threading
import websocket
import json
from sys import exit
try:
  from PIL import Image
except ImportError:
  exit("This script requires the pillow module\nInstall with: sudo pip install pillow")

unicorn.set_layout(unicorn.PHAT)
unicorn.rotation(0)
unicorn.brightness(0.5)
coffeeImg1 = Image.open('Coffee1.png')
coffeeImg = Image.open('Coffee.png')
lunchImg = Image.open('Lunch.png')
kickerImg = Image.open('Kicker.png')

logging.basicConfig(filename='coffee.log', level=logging.DEBUG)
def showPNG(image):
  for x in range(7):
      for y in range(4):
        pixel = image.getpixel((y,x))
        r,g,b = int(pixel[0]), int(pixel[1]), int(pixel[2])
        unicorn.set_pixel(x,3-y,r,g,b)

def showCoffee():
  global i,n
  i=0
  while i < 5:
    for p in range(min(4,n)):
      unicorn.set_pixel(7, 3-p, 0, 0 , 255)
    showPNG(coffeeImg)        
    unicorn.show()
    time.sleep(2)
    for p in range(min(4,n)):
      unicorn.set_pixel(7, 3-p, 0, 0 , 255)
    showPNG(coffeeImg1)
    unicorn.show()
    time.sleep(2)
    i=i+1
  unicorn.off()

def showIcon(name):
  global i,n
  i=0
  for p in range(min(4,n)):
      unicorn.set_pixel(7, 3-p, 0, 0 , 255)

  if(name == "Kicker"):
    showPNG(kickerImg)
  elif(name == "Lunch"):
    showPNG(lunchImg)
  elif(name == "Coffee"):
    showPNG(coffeeImg)
  unicorn.show()
  time.sleep(20)

n=1
myCoffeeThread = None
myLunchThread = None
myKickerThread = None
i=0
def on_message(ws, message):
  global myCoffeeThread, myKickerThread, myLunchThread, n, i
  myjson = json.loads(message)
  if("Coffee" in myjson["data"]["notification_title"]):
    if(myCoffeeThread is not None and myCoffeeThread.isAlive()):
      n=n+1
      i=0
    else:
      n=1
      myCoffeeThread = threading.Thread(target=showCoffee, name="blink")
      myCoffeeThread.start()
  elif("Kicker" in myjson["data"]["notification_title"]):
    if(myKickerThread is not None and myKickerThread.isAlive()):       
      n=n+1
      i=0
    else:
      n=1
      myKickerThread = threading.Thread(target=showIcon("Kicker"), name="show")
      myKickerThread.start()
  elif("Lunch" in myjson["data"]["notification_title"]):
    if(myLunchThread is not None and myLunchThread.isAlive()):
      n=n+1
      i=0
    else:
      n=1
      myLunchThread = threading.Thread(target=showIcon("Lunch"), name="show")
  logging.debug(message)

def on_error(ws, error):
  print(error)
  logging.error(error)

def on_close(ws):
  print("closed")
  logging.debug("closed")

def on_open(ws):
  subscribe(ws, "1", "")
  subscribe(ws, "6", "")
  subscribe(ws, "f6380db0-c00d-4e0c-8de6-bda0d83ab212", "")

def subscribe(ws, channel, password):
  if(password == ""):
    msg = '{"subscribe":{"channelId":\"' + channel + '\"}}'
  else:
    msg = '{"subscribe":{"channelId":\"' + channel + '\", "password":\"' + password + '\"}}'
  print(msg)
  logging.debug(msg)
  ws.send(msg) 


if __name__ == "__main__":
  websocket.enableTrace(True)
  ws = websocket.WebSocketApp("ws://coffee.waeco-soft.com/websocket",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)
  ws.on_open = on_open
  ws.run_forever()
