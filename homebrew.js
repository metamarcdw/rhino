function Connection () {
  if (!JDBC_URL || !USERID || !PASSWORD) {
    throw new Error('Please provide global Connection variables');
  }

  var IS_ORACLE = true; // TODO: Use another global for this once MSSQL is working
  var ORACLE_CLASS = 'oracle.jdbc.driver.OracleDriver';
  var MSSQL_CLASS = 'net.sourceforge.jtds.jdbc.Driver';
  this.DRIVER_CLASS = IS_ORACLE ? ORACLE_CLASS : MSSQL_CLASS;

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
}

Connection.prototype.setAutoCommit = function (bool) {
  this.conn.setAutoCommit(bool);
}

Connection.prototype.createStatement = function () {
  return this.conn.createStatement();
}

Connection.prototype.prepareStatement = function (query) {
  return this.conn.prepareStatement(query);
}

Connection.prototype.closeStatements = function () {
  if (this.rs) {
    this.rs.close();
  }
  if (this.stat) {
    this.stat.close();
  }
}

Connection.prototype.close = function () {
  if (this.conn) {
    this.conn.close();
  }
}

Connection.prototype.rollback = function () {
  if (this.conn) {
    this.conn.rollback();
  }
}

function Sql (conn, query) {
  this.query = query
  var params = Array.prototype.slice.call(arguments, 2);

  if (this.query.indexOf('?') !== -1) {
    if (params.length === 0) {
      throw new Error('No params were given');
    }
    var stat = this.stat = conn.prepareStatement(this.query);
    params.forEach(function (param, i) {
      if (typeof param === 'string' || param instanceof java.lang.String) {
        stat.setString(i + 1, param);
      } else if (typeof param === 'number' || param instanceof java.lang.Number) {
        stat.setLong(i + 1, java.lang.Long.valueOf(param));
      } else {
        throw new Error('Only string and number params are supported');
      }
    });
  } else {
    this.stat = conn.createStatement();
  }
  conn.stat = this.stat;

  if (this.query.toLowerCase().indexOf('select') !== -1){
    var isPrepared = this.stat instanceof java.sql.PreparedStatement;
    this.resultSet = isPrepared ? this.stat.executeQuery() : this.stat.executeQuery(this.query);
    this.rsmd = this.resultSet.getMetaData();
    conn.rs = this.resultSet;
  }
}

Sql.prototype.next = function () {
  var result = this.resultSet.next();
  if (result) {
    for (var i = 1; i <= this.rsmd.getColumnCount(); i++) {
      var name = ('' + this.rsmd.getColumnName(i)).toLowerCase();
      var type = java.lang.Class.forName(this.rsmd.getColumnClassName(i));
      this[name] = this.resultSet.getObject(i, type);
    }
  }
  return result;
}

Sql.prototype.executeUpdate = function () {
  var isPrepared = this.stat instanceof java.sql.PreparedStatement;
  var rows = isPrepared ? this.stat.executeUpdate() : this.stat.executeUpdate(this.query);
  return rows;
}
