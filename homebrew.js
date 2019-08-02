var PASSWORD = '';

function Connection () {
  if (!JDBC_URL) {
    throw new Error('Please provide global JDBC_URL variable');
  }

  var DBMS = 'mariadb'; // TODO: Use another global for this once MSSQL is working
  var ORACLE_CLASS = 'oracle.jdbc.driver.OracleDriver';
  var MSSQL_CLASS = 'net.sourceforge.jtds.jdbc.Driver';
  var MARIADB_CLASS = 'org.mariadb.jdbc.Driver';

  switch (DBMS) {
    case 'oracle':
      this.DRIVER_CLASS = ORACLE_CLASS;
      break;
    case 'mssql':
      this.DRIVER_CLASS = MSSQL_CLASS;
      break;
    case 'mariadb':
      this.DRIVER_CLASS = MARIADB_CLASS;
      break;
    default:
      throw new Error('Uknown DBMS type');
  }

  try {
    java.lang.Class.forName(this.DRIVER_CLASS);
  } catch (err) {
    if (err.javaException instanceof java.lang.ClassNotFoundException) {
      throw new Error('The JDBC Driver was not found.');
    } else {
      throw err;
    }
  }

  this.conn = java.sql.DriverManager.getConnection(JDBC_URL, USERID, PASSWORD);
  this.stats = [];
  this.rs = [];
}

Connection.prototype.setAutoCommit = function (bool) {
  this.conn.setAutoCommit(bool);
};

Connection.prototype.closeStatements = function () {
  this.rs.forEach(function (resultSet) {
    resultSet.close();
  });
  this.stats.forEach(function (statement) {
    statement.close();
  });
};

Connection.prototype.close = function () {
  this.conn.close();
};

Connection.prototype.rollback = function () {
  this.conn.rollback();
};

function Sql (conn, query) {
  this.query = query;
  var params = Array.prototype.slice.call(arguments, 2);

  if (this.query.indexOf('?') !== -1) {
    if (params.length === 0) {
      throw new Error('No params were given');
    }
    var stat = this.stat = conn.conn.prepareStatement(this.query);
    params.forEach(function (param, i) {
      if (typeof param === 'string' || param instanceof java.lang.String) {
        stat.setString(i + 1, param);
      } else if (typeof param === 'number' || param instanceof java.lang.Number) {
        stat.setLong(i + 1, java.lang.Long.valueOf(param));
      } else {
        throw new Error('Only string and number params are supported currently');
      }
    });
  } else {
    this.stat = conn.conn.createStatement();
  }
  conn.stats.push(this.stat);

  if (this.query.toLowerCase().indexOf('select') !== -1) {
    var isPrepared = this.stat instanceof java.sql.PreparedStatement;
    this.resultSet = isPrepared ? this.stat.executeQuery() : this.stat.executeQuery(this.query);
    this.rsmd = this.resultSet.getMetaData();
    conn.rs.push(this.resultSet);
  }
}

Sql.prototype.next = function () {
  var result = this.resultSet.next();
  if (result) {
    for (var i = 1; i <= this.rsmd.getColumnCount(); i++) {
      var name = ('' + this.rsmd.getColumnName(i)).toLowerCase();
      var type = java.lang.Class.forName(this.rsmd.getColumnClassName(i));

      if (type === java.lang.String) {
        this[name] = this.resultSet.getString(i);
      } else if (type.getGenericSuperclass() === java.lang.Number) {
        this[name] = this.resultSet.getLong(i);
      } else {
        print('Warning: Column type not implemented\n' + type);
        this[name] = this.resultSet.getObject(1, type);
      }
    }
  }
  return result;
};

Sql.prototype.executeUpdate = function () {
  var isPrepared = this.stat instanceof java.sql.PreparedStatement;
  var rows = isPrepared
    ? this.stat.executeUpdate()
    : this.stat.executeUpdate(this.query);
  return rows;
};
