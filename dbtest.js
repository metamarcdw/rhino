/* eslint-env nashorn */
/* global importClass Files Paths Charset DriverManager */

importClass(java.nio.file.Files);
importClass(java.nio.file.Paths);
importClass(java.nio.charset.Charset);
importClass(java.sql.DriverManager);

let conn, stat, resultSet;
const jdbcUrl = 'jdbc:mysql://db4free.net/rhinotest?user=cypher&password=dbpassword';
const outputLines = [];

try {
  const conn = DriverManager.getConnection(jdbcUrl);
  const stat = conn.createStatement();

  resultSet = stat.executeQuery('SELECT * FROM People;');
  while (resultSet.next()) {
    let name = resultSet.getString('name');
    let occupation = resultSet.getString('occupation');
    outputLines.push(name + ',' + occupation);
  }
} catch (e) {
  e.javaException instanceof java.sql.SQLException &&
    print('A database access error occurred.');
  e.javaException instanceof java.sql.SQLTimeoutException &&
    print('The driver has determined that the timeout value has been exceeded.');
} finally {
  resultSet.close();
  stat.close();
  conn.close();
}

try {
  const outputFile = Paths.get('outfile.csv');
  Files.write(outputFile, outputLines, Charset.forName('UTF-8'));
} catch (e) {
  e.javaException instanceof java.nio.file.InvalidPathException &&
    print('The path string cannot be converted to a Path.');
  e.javaException instanceof java.io.IOException &&
    print('An I/O error occurred writing to or creating the file.');
}
