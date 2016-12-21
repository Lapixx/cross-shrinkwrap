# cross-shrinkwrap
Removes all platform specific dependencies from your `npm-shrinkwrap.json` file.
Modified from [ansble/safe-shrinkwrap](https://github.com/ansble/safe-shrinkwrap), which was not working correctly for me. This command does not generate a shrinkwrap for you.

## Usage:

```bash
npm install -g Lapixx/cross-shrinkwrap  #install csw
npm shrinkwrap                          #generate sw
cross-shrinkwrap                        #clean sw
```
