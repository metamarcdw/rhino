// Adapted from: https://gist.github.com/davidekh/1e6bc46a8538c3430af6d7261a0cbad7

importPackage(java.sql);
importPackage(java.nio.file);
importClass(java.lang.Class);
importClass(java.lang.System);
importClass(java.lang.ClassNotFoundException);
importClass(java.nio.charset.Charset);
importClass(java.io.IOException);

try {
  // Make sure MariaDB driver is installed.
  Class.forName('org.mariadb.jdbc.Driver');
} catch (e) {
  e.javaException instanceof ClassNotFoundException &&
    print('The Mariadb JDBC Driver was not found.');
  System.exit(1);
}

let conn, stat, resultSet;
const jdbcUrl = 'jdbc:mariadb://db4free.net/rhinotest?user=cypher&password=dbpassword';
const outputLines = ['id,name,occupation'];

try {
  // Connect to db4free.net/rhinotest database
  conn = DriverManager.getConnection(jdbcUrl);
  stat = conn.createStatement();

  // Recreate People table
  stat.executeUpdate('DROP TABLE IF EXISTS People;');
  stat.executeUpdate('CREATE TABLE People(id INT AUTO_INCREMENT, name VARCHAR(30) NOT NULL, occupation VARCHAR(30) NOT NULL, PRIMARY KEY(id));');

  // Insert rows into People
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

  // Query all data from People
  resultSet = stat.executeQuery('SELECT * FROM People;');
  while (resultSet.next()) {
    let id = resultSet.getInt('id');
    let name = resultSet.getString('name');
    let occupation = resultSet.getString('occupation');
    outputLines.push(id + ',' + name + ',' + occupation);
  }
} catch (e) {
  e.javaException instanceof SQLException &&
    print('A database access error occurred.');
  e.javaException instanceof SQLTimeoutException &&
    print('The driver has determined that the timeout value has been exceeded.');
  if (conn) conn.rollback();
} finally {
  if (resultSet) resultSet.close();
  if (stat) stat.close();
  if (conn) conn.close();
}

if (outputLines.length === 1) System.exit(1);
try {
  // Output any data from server to CSV file
  const outputFile = Paths.get('outfile.csv');
  Files.write(outputFile, outputLines, Charset.forName('UTF-8'));
} catch (e) {
  e.javaException instanceof InvalidPathException &&
    print('The path string cannot be converted to a Path.');
  e.javaException instanceof IOException &&
    print('An I/O error occurred writing to or creating the file.');
}
