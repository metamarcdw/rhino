rhino() {
  java -cp "/home/cypher/Documents/rhino/rhino-1.7.11.jar:." org.mozilla.javascript.tools.shell.Main "$@"
}

homebrew() {
  cat ~/Documents/code/github/rhino/homebrew.js $1 > temp.js
  rhino temp.js
  rm temp.js
}
