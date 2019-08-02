var JDBC_URL = 'jdbc:oracle:thin:@db4.workforcehosting.net:1599:wfsprod3';
var USERID = 'centene_prod_mwood';
var PASSWORD = 'ynQCNLoQ3uK7Xg8uJgZHdf4';

function main () {
  var conn;

  try {
    conn = new Connection();
    conn.setAutoCommit(false);

    var query = <query>
      SELECT * FROM employee
      where sysdate between eff_dt and end_eff_dt
        and display_employee = ?
    </query>.toString();
    var selectSql = new Sql(conn, query, '081685');

    print('Running query...');
    while (selectSql.next()) {
      var firstName = selectSql.first_name;
      var lastName = selectSql.last_name;
      var displayEmployee = selectSql.display_employee;
      print(displayEmployee + ': ' + lastName + ', ' + firstName);
    }
  } catch (err) {
    print('An error has occurred.');
    print(err);
    conn.rollback();
  } finally {
    conn.closeStatements();
    conn.close();
  }
}

main();
