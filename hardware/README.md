# Install

## Dev
For development purposes, the Display is emulated in the Console. Make sure you use a console compatible with [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code).

It's recommended to use a virtual env. 

Run `pip3 install -r requirements.txt`.

## Prod 
Prod requires a Unicorn pHAT Display connected to your Raspberry Pi.

Run `pip3 install -r requirements.txt` and `sudo pip3 install unicornhat`.


# Configure
Configuration is done via the `config.yaml` file.
The file contains two properties:
- server: the host, port and protocol (`ws` or `wss`) of the Coffee-light server.
- channels: an array of channels. Each entry must contain a channel id. Optionally you can provide a channel password.

Note: if there is no `config.yaml` a sample config is created and used. [See config_samle.yaml](config_sample.yaml)


# Run
Execute `./mySocket.py` if your system supports shebang.

Otherwise, run `python3 mySocket.py`.

If no pHAT is detected, emulation will be used [see Install > Dev](#dev).
