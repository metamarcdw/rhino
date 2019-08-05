/* eslint no-unused-vars: 0 */
var DBMS = 'mariadb';
var JDBC_URL = 'jdbc:mariadb://db4free.net/rhinotest?user=cypher&password=dbpassword';
var USERID = null;
var PASSWORD = null;

function main () {
  var conn;

  try {
    conn = new Connection();
    conn.setAutoCommit(false);

    var query = (<query>
      SELECT * FROM People where name in (?, ?)
    </query>).toString();
    var selectSql = new Sql(conn, query, 'Gandhi', 'Turing');

    log.info('Running query...');
    while (selectSql.next()) {
      var id = selectSql.id;
      var name = selectSql.name;
      var occupation = selectSql.occupation;
      log.info(id + ',' + name + ',' + occupation);
      log.incrementRecordCount();
    }
  } catch (err) {
    log.error('An error has occurred.');
    log.error(err);
    if (conn) {
      conn.rollback();
    }
  } finally {
    if (conn) {
      conn.closeStatements();
      conn.close();
    }
  }
}

main();
