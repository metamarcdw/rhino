importClass(java.lang.Long);
importClass(java.lang.Double);
importClass(java.lang.Float);
importClass(java.lang.Class);
importClass(java.lang.ClassNotFoundException);
importPackage(java.sql);

var JavaString = java.lang.String;
var JavaNumber = java.lang.Number;
var JavaSqlDate = java.sql.Date;

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
    Class.forName(DRIVER_CLASS);
  } catch (err) {
    if (err.javaException instanceof ClassNotFoundException) {
      print('The JDBC Driver was not found.');
    }
    throw err;
  }

  this.conn = DriverManager.getConnection(JDBC_URL, USERID, PASSWORD);
  this.stats = [];
  this.rs = [];
}

Connection.prototype._getWrappedConnection = function () {
  return this.conn;
};

Connection.prototype.setAutoCommit = function (bool) {
  this.conn.setAutoCommit(bool);
};

Connection.prototype.commit = function () {
  this.conn.commit();
};

Connection.prototype.rollback = function () {
  this.conn.rollback();
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

function Sql (conn, query) {
  this.conn = conn;
  this.query = query;
  this.noParams = false;
  var params = Array.prototype.slice.call(arguments, 2);
  var jdbcConn = this.conn._getWrappedConnection();

  if (this.query.indexOf('?') !== -1) {
    this.stat = jdbcConn.prepareStatement(this.query);
    if (params.length === 0) {
      this.noParams = true;
    } else {
      this._mapParams(params);
    }
  } else {
    this.stat = jdbcConn.createStatement();
  }
  this.conn.stats.push(this.stat);
}

Sql.prototype._mapParams = function (params) {
  params.forEach(function (param, index) {
    index++; // 1-indexed
    if (typeof param === 'string' || param instanceof JavaString) {
      this.stat.setString(index, param);
    } else if (typeof param === 'number' || param instanceof JavaNumber) {
      if (param % 1 !== 0 || param instanceof Double || param instanceof Float) {
        this.stat.setDouble(index, Double.valueOf(param));
      } else {
        this.stat.setLong(index, Long.valueOf(param));
      }
    } else {
      throw new Error('Only string and number params are supported currently');
    }
  }, this);
};

Sql.prototype._getParams = function () {
  var params = [];
  for (var i = 0; i <= 100; i++) {
    if (this[i]) {
      params.push(this[i]);
    }
  }
  return params;
};

Sql.prototype.next = function () {
  if (!this.resultSet && /^\s*select/i.test(this.query)) {
    var isPrepared = this.stat instanceof PreparedStatement;
    if (isPrepared && this.noParams) {
      var params = this._getParams();
      this._mapParams(params);
    }
    this.resultSet = isPrepared
      ? this.stat.executeQuery()
      : this.stat.executeQuery(this.query);
    this.rsmd = this.resultSet.getMetaData();
    this.conn.rs.push(this.resultSet);
  }
  var result = this.resultSet.next();
  if (result) {
    this._mapResults();
  }
  return result;
};

Sql.prototype._mapResults = function () {
  for (var i = 1; i <= this.rsmd.getColumnCount(); i++) { // 1-indexed
    var name = ('' + this.rsmd.getColumnName(i)).toLowerCase();
    var type = Class.forName(this.rsmd.getColumnClassName(i));

    if (type === JavaString) {
      this[name] = this.resultSet.getString(i);
    } else if (type.getGenericSuperclass() === JavaNumber) {
      if (type === Double || type === Float) {
        this[name] = this.resultSet.getDouble(i);
      } else {
        this[name] = this.resultSet.getLong(i);
      }
    } else if (type === JavaSqlDate) {
      this[name] = this.resultSet.getDate(i).toString();
    } else {
      print('Warning: Column type (' + type + ') not implemented. Using getObject.');
      this[name] = this.resultSet.getObject(1, type);
    }
  }
};

Sql.prototype.executeUpdate = function () {
  if (!/^\s*(insert|update|delete)/i.test(this.query)) {
    throw new Error('The given query is not an update');
  }
  var isPrepared = this.stat instanceof PreparedStatement;
  if (isPrepared && this.noParams) {
    var params = this._getParams();
    this._mapParams(params);
  }
  var rows = isPrepared
    ? this.stat.executeUpdate()
    : this.stat.executeUpdate(this.query);
  return rows;
};

function formatTimestamp (date) {
  var pad = function (val) {
    return ('00' + val).slice(-2);
  };
  return date.getFullYear() + '-' +
    pad((date.getMonth() + 1)) + '-' +
    pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds());
}

function getLogFunc (type) {
  return function (text) {
    var time = formatTimestamp(new Date());
    print('[' + type.toUpperCase() + '] ' + time + ' ' + text);
  };
}

var log = { // eslint-disable-line no-unused-vars
  debug: getLogFunc('debug'),
  info: getLogFunc('info'),
  warning: getLogFunc('warning'),
  error: getLogFunc('error'),
  summary: getLogFunc('summary'),
  incrementRecordCount: function () {
    print('Warning: incrementRecordCount is a NOP');
  }
};

var jsHost = { // eslint-disable-line no-unused-vars
  throwIfAbortRequested: function () {}
};
