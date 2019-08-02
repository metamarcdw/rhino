rhino() {
  java -cp "/home/cypher/Documents/rhino/rhino-1.7.11.jar:." org.mozilla.javascript.tools.shell.Main "$@"
}

homebrew() {
  sed "s/log\.\w*/print/g" $1 > temp1.js
  cat ~/Documents/code/github/rhino/homebrew.js temp1.js > temp2.js
  rhino temp2.js
  rm temp*.js
}
