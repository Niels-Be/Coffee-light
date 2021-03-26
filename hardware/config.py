import yaml, io, shutil

_file_stream = None
try:
  _file_stream = io.open('config.yaml', 'r')
except(FileNotFoundError):
  shutil.copy2('config_sample.yaml', 'config.yaml')
  _file_stream = io.open('config.yaml', 'r')

_config = yaml.safe_load(_file_stream)
_file_stream.close()

class InvalidConfigException(Exception):
  pass

def _verify_config(conf):
  if conf is None:
    raise InvalidConfigException("empty config")
  if "server" not in conf:
    raise InvalidConfigException("Config must contain server")
  if not isinstance(conf["server"], str):
    raise InvalidConfigException("Server must be a string")
  if "channels" not in conf:
    raise InvalidConfigException("Config must contain an array of channels")
  if not isinstance(conf["channels"], list):
    raise InvalidConfigException("Channels must be a list")

  for i in range(0, len(conf["channels"])):
    if "id" not in conf["channels"][i]:
      raise InvalidConfigException("Ever configured channel must contain an id. Channel[" + str(i) + "] does not.")
    if "password" not in conf["channels"][i]:
      conf["channels"][i]["password"] = ""

    if not isinstance(conf["channels"][i]["id"], str):
      raise InvalidConfigException("Invalid channel[" + str(i) + "]: id must be a string")
    if not isinstance(conf["channels"][i]["password"], str):
      raise InvalidConfigException("Invalid channel[" + str(i) + "]: password must be a string")

_verify_config(_config)

server = _config["server"]
while server.endswith("/"):
  server = server[:len(server)-1]

def get_server():
  return server

def get_channels():
  return _config["channels"]
