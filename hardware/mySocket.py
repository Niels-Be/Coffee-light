#!/usr/bin/env python3

import config as conf
import logging
import colorsys
import math
import time
import signal

try:
  import unicornhat as unicorn
except ImportError:
  print("Could not import unicornhat. Falling back to mock display.")
  import unimog as unicorn

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
currentMessageId = ""
i=0
def on_message(ws, message):
  logging.debug(message)
  myjson = json.loads(message)
  type = myjson["data"]["type"]
  if(type == "notify"):
    return on_notify(ws, myjson)
  if(type == "replay"):
    return on_replay(ws, myjson)

  logging.error("Unsupported Message: " + str(myjson) )

def on_replay(ws, myjson):
  global n, i, currentMessageId
  if(myjson["data"]["messageId"] == currentMessageId and myjson["data"]["action"] == "accept"):
    n=n+1
    i=0
  else:
    logging.debug("Ignored Replay: " + str(myjson) )

def on_notify(ws, myjson):
  global myCoffeeThread, myKickerThread, myLunchThread, n, i, currentMessageId
  currentMessageId = myjson["data"]["messageId"]
  if("Coffee" in myjson["data"]["notification_title"] or "coffee.png" == myjson["data"]["notification_icon"]):
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

def on_error(ws, error):
  print("WebSocket error:", error)
  logging.error(error)

def on_close(ws):
  print("closed")
  logging.debug("closed")

def on_open(ws):
  print("connected")
  channels = conf.get_channels()
  for i in range(0, len(channels)):
    subscribe(ws, channels[i]["id"], channels[i]["password"])

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
  url = conf.get_server() + "/websocket"
  print("connecting to url", url, "...")
  ws = websocket.WebSocketApp(url,
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)
  ws.on_open = on_open
  ws.run_forever()
