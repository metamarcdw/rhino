/* eslint-env nashorn */
/* global importClass Files Paths Charset DriverManager */

// Adapted from: https://gist.github.com/davidekh/1e6bc46a8538c3430af6d7261a0cbad7

importClass(java.nio.file.Files);
importClass(java.nio.file.Paths);
importClass(java.nio.charset.Charset);
importClass(java.sql.DriverManager);

let conn, stat, resultSet;
const jdbcUrl = 'jdbc:mysql://db4free.net/rhinotest?user=cypher&password=dbpassword';
const outputLines = ['id,name,occupation'];

try {
  conn = DriverManager.getConnection(jdbcUrl);
  stat = conn.createStatement();

  stat.executeUpdate('DROP TABLE IF EXISTS People;');
  stat.executeUpdate('CREATE TABLE People(id INT AUTO_INCREMENT, name VARCHAR(30) NOT NULL, occupation VARCHAR(30) NOT NULL, PRIMARY KEY(id));');

  conn.setAutoCommit(false);
  const prep = conn.prepareStatement('INSERT INTO People (name, occupation) VALUES (?, ?);');

  prep.setString(1, 'Marc');
  prep.setString(2, 'IE');
  prep.addBatch();
  prep.setString(1, 'Gandhi');
  prep.setString(2, 'politics');
  prep.addBatch();
  prep.setString(1, 'Turing');
  prep.setString(2, 'computers');
  prep.addBatch();

  prep.executeBatch();
  conn.commit();
  conn.setAutoCommit(true);

  resultSet = stat.executeQuery('SELECT * FROM People;');
  while (resultSet.next()) {
    let id = resultSet.getInt('id');
    let name = resultSet.getString('name');
    let occupation = resultSet.getString('occupation');
    outputLines.push(id + ',' + name + ',' + occupation);
  }
} catch (e) {
  e.javaException instanceof java.sql.SQLException &&
    print('A database access error occurred.');
  e.javaException instanceof java.sql.SQLTimeoutException &&
    print('The driver has determined that the timeout value has been exceeded.');
  conn.rollback();
} finally {
  if (resultSet) resultSet.close();
  if (stat) stat.close();
  if (conn) conn.close();
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
