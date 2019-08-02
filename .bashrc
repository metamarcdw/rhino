rhino() {
  java -cp "C:\Program Files\Java\rhino1.7.7.1\lib\rhino-1.7.7.1.jar;C:\Program Files\Java\rhino1.7.7.1\jars\mariadb-java-client-2.4.0.jar;C:\Users\mwood\.dbvis\jdbc\OracleJDBC\12.1.0.2\ojdbc7.jar;C:\Users\mwood\.dbvis\jdbc\jtds\1.2\jtds-1.2.jar;." org.mozilla.javascript.tools.shell.Main
}

homebrew() {
  sed "s/log\.\w*/print/g" $1 > temp1.js
  cat "C:\Users\mwood\OneDrive - WorkForce Software\Documents\mwood\UTIL\homebrew\homebrew.js" temp1.js > temp2.js
  rhino temp2.js
  rm temp*.js
}
