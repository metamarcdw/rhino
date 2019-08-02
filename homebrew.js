var PASSWORD = '';

function Connection () {
  if (!DBMS || !JDBC_URL) {
    throw new Error('Please provide required global variables');
  }

  var DRIVER_CLASS;
  switch (DBMS) {
    case 'oracle':
      DRIVER_CLASS = 'oracle.jdbc.driver.OracleDriver';
      break;
    case 'mssql':
      DRIVER_CLASS = 'net.sourceforge.jtds.jdbc.Driver';
      break;
    case 'mariadb':
      DRIVER_CLASS = 'org.mariadb.jdbc.Driver';
      break;
    default:
      throw new Error('Uknown DBMS type');
  }

  try {
    java.lang.Class.forName(DRIVER_CLASS);
  } catch (err) {
    if (err.javaException instanceof java.lang.ClassNotFoundException) {
      print('The JDBC Driver was not found.');
    }
    throw err;
  }

  this.conn = java.sql.DriverManager.getConnection(JDBC_URL, USERID, PASSWORD);
  this.stats = [];
  this.rs = [];
}

Connection.prototype.getWrappedConnection = function () {
  return this.conn;
};

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

Connection.prototype.commit = function () {
  this.conn.commit();
};

Connection.prototype.rollback = function () {
  this.conn.rollback();
};

function Sql (conn, query) {
  this.query = query;
  var params = Array.prototype.slice.call(arguments, 2);
  var jdbcConn = conn.getWrappedConnection();

  if (this.query.indexOf('?') !== -1) {
    if (params.length === 0) {
      throw new Error('No params were given');
    }
    this.stat = jdbcConn.prepareStatement(this.query);

    params.forEach(function (param, index) {
      index++; // 1-indexed
      if (typeof param === 'string' || param instanceof java.lang.String) {
        this.stat.setString(index, param);
      } else if (typeof param === 'number' || param instanceof java.lang.Number) {
        this.stat.setLong(index, java.lang.Long.valueOf(param));
      } else {
        throw new Error('Only string and number params are supported currently');
      }
    }, this);
  } else {
    this.stat = jdbcConn.createStatement();
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
    for (var i = 1; i <= this.rsmd.getColumnCount(); i++) { // 1-indexed
      var name = ('' + this.rsmd.getColumnName(i)).toLowerCase();
      var type = java.lang.Class.forName(this.rsmd.getColumnClassName(i));

      if (type === java.lang.String) {
        this[name] = this.resultSet.getString(i);
      } else if (type.getGenericSuperclass() === java.lang.Number) {
        if (type === java.lang.Double || type === java.lang.Float) {
          this[name] = this.resultSet.getDouble(i);
        } else {
          this[name] = this.resultSet.getLong(i);
        }
      } else if (type === java.sql.Date) {
        this[name] = this.resultSet.getDate(i).toString();
      } else {
        print('Warning: Column type (' + type + ') not implemented. Using getObject.');
        this[name] = this.resultSet.getObject(1, type);
      }
    }
  }
  return result;
};

Sql.prototype.executeUpdate = function () {
  var isPrepared = this.stat instanceof java.sql.PreparedStatement;
  var rows = this.stat.executeUpdate(isPrepared ? undefined : this.query);
  return rows;
};

var log = {
  info: function (text) {
    print(text);
  },

  warning: function (text) {
    print(text);
  },

  error: function (text) {
    print(text);
  },

  summary: function (text) {
    print(text);
  }
};
