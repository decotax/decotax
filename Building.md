Tested in Ubuntu 22.04.1 on WSL2.  Here are steps to [Install Ubuntu on WSL2](https://ubuntu.com/tutorials/install-ubuntu-on-wsl2-on-windows-11-with-gui-support).

**Clone repo**

* Run: `git clone git@github.com:decotax/decotax.git`
* Run: `cd decotax`

**Install Node.js and NPM**

* Run: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash` ([source](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl))
* Close and reopen terminal, confirm `nvm -v`
* Run: `nvm install --lts`
* Confirm `node -v`
* Run: `npm install -g npm@latest`
* Confirm `npm -v`

**Build and run**

* Run: `./build.sh`
* Run: `./run.sh`
* Visit: [http://localhost:8000/main.html](http://localhost:8000/main.html)
