require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],2:[function(require,module,exports){
(function (global){
'use strict'

const EventEmitter = require('events')

class RippledWsClient extends EventEmitter {
  constructor (Endpoint) {
    super()

    let Connection = {
      Online: false,
      Timeout: {
        ConnectSeconds: 15,
        RequestSeconds: 10,
        PingTimeoutSeconds: 4,
        $: null
      },
      MomentLastResponse: null,
      Ping: {
        Latency: {
          Last: null,
          Moment: null,
          Avg: null,
          Recent: []
        },
        Hiccups: 0,
        $: null
      },
      TryCount: -1,
      Promise: null,
      WebSocket: null,
      ClosedIntentionally: false,
      Subscriptions: [],
      Server: {
        Version: null,
        PublicKey: '',
        Endpoint: Endpoint,
        Ledgers: '',
        LastLedger: null,
        Fee: {
          Last: null,
          Moment: null,
          Avg: null,
          Recent: []
        }
      },
      RetryTimeout: null
    }

    let RequestId = 0
    let OpenRequests = []
    let SetIsOnline = (State) => {
      clearInterval(Connection.Ping.$)
      clearTimeout(Connection.Timeout.$)
      if (State !== Connection.Online) {
        Connection.Online = State
        Connection.Ping.Hiccups = 0
        this.emit('state', State)
        if (!Connection.Online) {
          // We are now offline
        } else {
          // We are now online
          clearTimeout(Connection.RetryTimeout)
          this.send({
            command: 'subscribe',
            streams: [ 'ledger' ]
          })
          Connection.Ping.$ = setInterval(() => {
            WebSocketRequest({
              command: 'ping'
            }, Connection.Timeout.PingTimeoutSeconds).then(ProcessPong).catch(ProcessPong)
          }, 3 * 1000)
        }
      }
    }
    let ProcessPong = (Pong) => {
      if (Pong && typeof Pong === 'object' && typeof Pong.__replyMs !== 'undefined') {
        Connection.Ping.Hiccups = 0
        Connection.Ping.Latency.Last = Pong.__replyMs
        Connection.Ping.Latency.Recent.unshift(Pong.__replyMs)
        Connection.Ping.Latency.Recent.slice(0, 30)
        Connection.Ping.Latency.Moment = new Date()
        Connection.Ping.Latency.Avg = Connection.Ping.Latency.Recent.reduce((a, b) => {
          return a + b
        }, 0) / Connection.Ping.Latency.Recent.length
      } else {
        if (Connection.Online && !Connection.ClosedIntentionally) {
          Connection.Ping.Hiccups++
          if (Connection.Ping.Hiccups > 1) {
            this.emit('error', {
              type: 'ping_hiccup',
              error: 'Ping hiccup! Not sure if online...',
              message: Connection.Ping.Hiccups
            })
          }
          if (Connection.Ping.Hiccups > 3) {
            // Online, but assume no connection
            SetIsOnline(false)
            Connection.WebSocket.close()
          }
        }
      }
    }
    let SetFee = (ServerInfo) => {
      let feeCushion = 1.2
      let NewFee = ServerInfo.load_factor * ServerInfo.validated_ledger.base_fee_xrp * 1000 * 1000 * feeCushion
      if (NewFee !== Connection.Server.Fee.Last) {
        // Fee changed
      }
      Connection.Server.Fee.Last = NewFee
      Connection.Server.Fee.Recent.unshift(NewFee)
      Connection.Server.Fee.Recent.slice(0, 30)
      Connection.Server.Fee.Avg = Connection.Server.Fee.Recent.reduce((a, b) => {
        return a + b
      }, 0) / Connection.Server.Fee.Recent.length
      Connection.Server.Fee.Moment = new Date()
    }
    let WebSocketState = () => {
      let LedgerCount = 0
      if (Connection.Server.Ledgers !== '') {
        LedgerCount = Connection.Server.Ledgers.split(',').map((m) => {
          let Range = m.split('-')
          if (Range.length > 1) {
            return parseInt(Range[1]) - parseInt(Range[0])
          }
          return 1
        }).reduce((a, b) => {
          return a + b
        }, 0)
      }
      let CurrentDate = new Date()
      return {
        online: Connection.Online,
        latencyMs: {
          last: Connection.Ping.Latency.Last,
          avg: Connection.Ping.Latency.Avg,
          secAgo: Connection.Ping.Latency.Moment ? (CurrentDate - Connection.Ping.Latency.Moment) / 1000 : null
        },
        server: {
          version: Connection.Server.Version,
          publicKey: Connection.Server.PublicKey,
          uri: Connection.Server.Endpoint
        },
        ledger: {
          last: Connection.Server.LastLedger,
          validated: Connection.Server.Ledgers,
          count: LedgerCount
        },
        fee: {
          last: Connection.Server.Fee.Last,
          avg: Connection.Server.Fee.Avg,
          secAgo: Connection.Server.Fee.Moment ? (CurrentDate - Connection.Server.Fee.Moment) / 1000 : null
        },
        secLastContact: Connection.MomentLastResponse ? (CurrentDate - Connection.MomentLastResponse) / 1000 : null
      }
    }
    let WebSocketClose = () => {
      return new Promise((resolve, reject) => {
        if (Connection.WebSocket.readyState !== Connection.WebSocket.CLOSED && Connection.WebSocket.readyState !== Connection.WebSocket.CLOSING) {
          OpenRequests.forEach(Request => {
            Request.reject(new Error('Connection closed (by client)'))
            clearTimeout(Request.timeout)
          })
          Connection.WebSocket.onclose = (ConnectionCloseEvent) => {
            SetIsOnline(false)
            this.emit('close', ConnectionCloseEvent)
            resolve(ConnectionCloseEvent)
          }
          Connection.WebSocket.close()
        } else {
          if (Connection.ClosedIntentionally) {
            reject(new Error('WebSocket in CLOSED or CLOSING state'))
          } else {
            // Do not reject, not closed, probably in retry-state.
            // We will cleanup and prevent new connection opening
            clearTimeout(Request.timeout)
          }
        }
        Connection.ClosedIntentionally = true
      })
    }
    let WebSocketRequest = (Request, Timeout) => {
      RequestId++
      let RequestTimeout = Connection.Timeout.RequestSeconds
      if (typeof Timeout !== 'undefined') {
        if (!isNaN(parseFloat(Timeout))) {
          RequestTimeout = parseFloat(Timeout)
        }
      }

      let OpenRequest = {
        id: RequestId,
        promise: null,
        resolve: null,
        reject: null,
        timeout: null,
        command: null,
        request: Request,
        moment: new Date()
      }

      if (Request && typeof Request === 'object' && ([ 'subscribe', 'unsubscribe' ].indexOf(Request.command.toLowerCase()) > -1)) {
        if (typeof Request.id === 'undefined') {
          // Initial request, no id yet
          if (Object.keys(Request).length === 2 && Request.command === 'subscribe' && typeof Request.streams !== 'undefined' && Request.streams.length === 1 && Request.streams[0] === 'ledger') {
            // This is our own subscription
          } else {
            Connection.Subscriptions.push(Request)
          }
        }
      }

      OpenRequest.promise = new Promise((resolve, reject) => {
        OpenRequest.reject = (rejectData) => {
          clearTimeout(OpenRequest.timeout)
          OpenRequests.splice(OpenRequests.indexOf(OpenRequest), 1)
          reject(rejectData)
        }
        OpenRequest.resolve = (resolveData) => {
          clearTimeout(OpenRequest.timeout)
          Object.assign(resolveData, {
            __command: OpenRequest.command,
            __replyMs: new Date() - OpenRequest.moment
          })
          resolve(resolveData)
        }

        OpenRequest.timeout = setTimeout(reject, RequestTimeout * 1000, new Error('Request Timeout'))
        if (Connection.WebSocket.readyState === Connection.WebSocket.OPEN) {
          if (typeof Request === 'object') {
            Object.assign(Request, {
              id: RequestId
            })
            if (typeof Request.command === 'string') {
              OpenRequest.command = Request.command
            }
            try {
              let RequestJson = JSON.stringify(Request)
              Connection.WebSocket.send(RequestJson)
            } catch (e) {
              reject(e)
            }
          } else {
            reject(new Error('Request not typeof object'))
          }
        } else {
          // Todo: reconnect?
          reject(new Error('WebSocket not in OPEN state'))
        }
      })

      OpenRequests.push(OpenRequest)

      return OpenRequest.promise
    }

    Object.assign(this, {
      send: WebSocketRequest,
      close: WebSocketClose,
      getState: WebSocketState
    })

    let MasterPromise = new Promise((resolve, reject) => {
      let CreateConnection = () => {
        Connection.TryCount++
        let RetryConnection = () => {
          if (!Connection.ClosedIntentionally) {
            let RetryInSeconds = 2 + (3 * Connection.TryCount)
            if (RetryInSeconds < 0) RetryInSeconds = 0
            if (RetryInSeconds > 60) RetryInSeconds = 60
            clearTimeout(Connection.RetryTimeout)
            Connection.RetryTimeout = setTimeout(() => {
              this.emit('retry', {
                endpoint: Endpoint,
                retryInSeconds: RetryInSeconds,
                tryCount: Connection.TryCount
              })
              CreateConnection()
            }, RetryInSeconds * 1000)
          }
        }

        Connection.Timeout.$ = setTimeout(() => {
          RetryConnection()
        }, Connection.Timeout.ConnectSeconds * 1000)
        try {
          if (typeof window === 'undefined' && typeof global !== 'undefined' && typeof global['WebSocket'] === 'undefined') {
            // We're running nodejs, no WebSocket client availabe.
            const WebSocket = require('websocket').w3cwebsocket
            Connection.WebSocket = new WebSocket(Endpoint)
          } else {
            // W3C WebSocket
            Connection.WebSocket = new WebSocket(Endpoint)
          }
        } catch (ConnectionError) {
          if (!Connection.WebSocket) {
            SetIsOnline(false)
            reject(ConnectionError)
          }
        }

        if (Connection.WebSocket) {
          Connection.WebSocket.onclose = (ConnectionCloseEvent) => {
            SetIsOnline(false)
            RetryConnection()
          }
          Connection.WebSocket.onerror = (ConnectionError) => {
            SetIsOnline(false)
            RetryConnection()
            Connection.WebSocket.close()
          }
          Connection.WebSocket.onopen = (ConnectEvent) => {
            WebSocketRequest({
              command: 'server_info'
            }).then((ServerInfo) => {
              if (typeof ServerInfo.info === 'object' && typeof ServerInfo.info.build_version !== 'undefined' && typeof ServerInfo.info.pubkey_node !== 'undefined') {
                Connection.Server.Version = ServerInfo.info.build_version
                Connection.Server.PublicKey = ServerInfo.info.pubkey_node
                Connection.Server.Ledgers = ServerInfo.info.complete_ledgers
                Connection.Server.LastLedger = ServerInfo.info.validated_ledger.seq
                SetFee(ServerInfo.info)
              } else {
                reject(new Error('Invalid rippled server, received no .info.build_version or .info.pubkey_node at server_info request'))
              }
            }).catch((ServerInfoTimeout) => {
              this.emit('error', {
                type: 'serverinfo_timeout',
                error: 'Connected, sent server_info, got no info within ' + Connection.Timeout.PingTimeoutSeconds + ' seconds, assuming not connected'
              })
              Connection.WebSocket.close()
            })
            WebSocketRequest({
              command: 'ping'
            }, Connection.Timeout.PingTimeoutSeconds).then((Pong) => {
              ProcessPong(Pong)
              SetIsOnline(true)
              this.emit('reconnect', {
                endpoint: Endpoint,
                tryCount: Connection.TryCount,
                subscriptions: Connection.Subscriptions
              })
              Connection.TryCount = 0
              resolve(this)
              Connection.Subscriptions.forEach((Subscription) => {
                WebSocketRequest(Subscription)
              })
            }).catch((PingTimeout) => {
              this.emit('error', {
                type: 'ping_error',
                error: 'Connected, sent ping, got no pong, assuming not connected',
                message: PingTimeout
              })
              Connection.WebSocket.close()
            })
          }
          Connection.WebSocket.onmessage = (Message) => {
            let MessageJson
            try {
              MessageJson = JSON.parse(Message.data)
              Connection.MomentLastResponse = new Date()
            } catch (e) {
              this.emit('error', {
                type: 'ping_timeout',
                error: 'Connected, sent ping, got no pong within ' + Connection.Timeout.PingTimeoutSeconds + ' seconds, assuming not connected',
                message: Message
              })
            }

            if (MessageJson && MessageJson !== null && typeof MessageJson.id !== 'undefined') {
              let ReplyAt = OpenRequests.filter(Request => {
                return Request.id === MessageJson.id
              })
              if (ReplyAt.length === 1) {
                if (typeof MessageJson.status !== 'undefined') {
                  if (typeof MessageJson.type !== 'undefined') {
                    if (typeof MessageJson.result !== 'undefined') {
                      ReplyAt[0].resolve(MessageJson.result)
                    } else {
                      ReplyAt[0].resolve(MessageJson)
                    }
                  } else {
                    ReplyAt[0].reject(new Error('Message received without .type property'))
                  }
                } else {
                  ReplyAt[0].reject(new Error('Message received without .status property'))
                }
              } else {
                this.emit('error', {
                  type: 'message_invalid_response',
                  error: 'Invalid response, .id not in OpenRequests',
                  message: MessageJson
                })
              }
            } else {
              if (MessageJson && typeof MessageJson.validated_ledgers !== 'undefined' && typeof MessageJson.ledger_index !== 'undefined') {
                if (MessageJson.type === 'ledgerClosed') {
                  Connection.Server.Ledgers = MessageJson.validated_ledgers
                  Connection.Server.LastLedger = MessageJson.ledger_index
                  // Get new fee
                  this.send({ command: 'server_info' }).then((i) => {
                    SetFee(i.info)
                  }).catch((e) => {})
                }
                this.emit('ledger', MessageJson)
              } else if (MessageJson && typeof MessageJson.type !== 'undefined' && MessageJson.type === 'transaction') {
                this.emit('transaction', MessageJson)
              } else if (MessageJson && typeof MessageJson.validation_public_key !== 'undefined') {
                this.emit('validation', MessageJson)
              } else {
                this.emit('error', {
                  type: 'message_invalid_json',
                  error: 'Invalid JSON message, no request (no .id property), and not a specified subscription',
                  message: MessageJson
                })
              }
            }
          }
        }
      }

      CreateConnection()
    })

    return MasterPromise
  }
}

module.exports = RippledWsClient

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":1,"websocket":3}],3:[function(require,module,exports){
var _global = (function() { return this; })();
var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;
var websocket_version = require('./version');


/**
 * Expose a W3C WebSocket class with just one or two arguments.
 */
function W3CWebSocket(uri, protocols) {
	var native_instance;

	if (protocols) {
		native_instance = new NativeWebSocket(uri, protocols);
	}
	else {
		native_instance = new NativeWebSocket(uri);
	}

	/**
	 * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
	 * class). Since it is an Object it will be returned as it is when creating an
	 * instance of W3CWebSocket via 'new W3CWebSocket()'.
	 *
	 * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
	 */
	return native_instance;
}
if (NativeWebSocket) {
	['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function(prop) {
		Object.defineProperty(W3CWebSocket, prop, {
			get: function() { return NativeWebSocket[prop]; }
		});
	});
}

/**
 * Module exports.
 */
module.exports = {
    'w3cwebsocket' : NativeWebSocket ? W3CWebSocket : null,
    'version'      : websocket_version
};

},{"./version":4}],4:[function(require,module,exports){
module.exports = require('../package.json').version;

},{"../package.json":5}],5:[function(require,module,exports){
module.exports={
  "_args": [
    [
      "websocket@1.0.26",
      "D:\\project\\ult\\rippled-ws-client-pool"
    ]
  ],
  "_from": "websocket@1.0.26",
  "_id": "websocket@1.0.26",
  "_inBundle": false,
  "_integrity": "sha512-fjcrYDPIQxpTnqFQ9JjxUQcdvR89MFAOjPBlF+vjOt49w/XW4fJknUoMz/mDIn2eK1AdslVojcaOxOqyZZV8rw==",
  "_location": "/websocket",
  "_phantomChildren": {},
  "_requested": {
    "type": "version",
    "registry": true,
    "raw": "websocket@1.0.26",
    "name": "websocket",
    "escapedName": "websocket",
    "rawSpec": "1.0.26",
    "saveSpec": null,
    "fetchSpec": "1.0.26"
  },
  "_requiredBy": [
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/websocket/-/websocket-1.0.26.tgz",
  "_spec": "1.0.26",
  "_where": "D:\\project\\ult\\rippled-ws-client-pool",
  "author": {
    "name": "Brian McKelvey",
    "email": "brian@worlize.com",
    "url": "https://www.worlize.com/"
  },
  "browser": "lib/browser.js",
  "bugs": {
    "url": "https://github.com/theturtle32/WebSocket-Node/issues"
  },
  "config": {
    "verbose": false
  },
  "contributors": [
    {
      "name": "Iñaki Baz Castillo",
      "email": "ibc@aliax.net",
      "url": "http://dev.sipdoc.net"
    }
  ],
  "dependencies": {
    "debug": "^2.2.0",
    "nan": "^2.3.3",
    "typedarray-to-buffer": "^3.1.2",
    "yaeti": "^0.0.6"
  },
  "description": "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
  "devDependencies": {
    "buffer-equal": "^1.0.0",
    "faucet": "^0.0.1",
    "gulp": "git+https://github.com/gulpjs/gulp.git#4.0",
    "gulp-jshint": "^2.0.4",
    "jshint": "^2.0.0",
    "jshint-stylish": "^2.2.1",
    "tape": "^4.0.1"
  },
  "directories": {
    "lib": "./lib"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "homepage": "https://github.com/theturtle32/WebSocket-Node",
  "keywords": [
    "websocket",
    "websockets",
    "socket",
    "networking",
    "comet",
    "push",
    "RFC-6455",
    "realtime",
    "server",
    "client"
  ],
  "license": "Apache-2.0",
  "main": "index",
  "name": "websocket",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/theturtle32/WebSocket-Node.git"
  },
  "scripts": {
    "gulp": "gulp",
    "install": "(node-gyp rebuild 2> builderror.log) || (exit 0)",
    "test": "faucet test/unit"
  },
  "version": "1.0.26"
}

},{}],"rippled-ws-client-pool":[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');
var RippledWsClient = require('rippled-ws-client');
// const RippledWsClient = require('./rippled-ws-client.js')
// Todo: log first responder

var RippledWsClientPool = function (_EventEmitter) {
  _inherits(RippledWsClientPool, _EventEmitter);

  function RippledWsClientPool(Config) {
    _classCallCheck(this, RippledWsClientPool);

    var _this = _possibleConstructorReturn(this, (RippledWsClientPool.__proto__ || Object.getPrototypeOf(RippledWsClientPool)).call(this));

    var TX_HISTORY_LENGTH = 500;

    var Servers = [];
    var Connections = {};
    var LastLedger = null;
    var WatchAccounts = {};
    var RecentTransactions = [];
    var FirstResponders = [];

    var GetSocketProtocol = function GetSocketProtocol(Endpoint) {
      var hostname = Endpoint.toLowerCase().trim();
      var protocol = void 0;
      if (hostname.match(/:\/\//)) {
        protocol = hostname.split('://')[0];
      }
      if (protocol !== 'wss' && protocol !== 'ws') {
        protocol = 'wss';
      }
      return protocol;
    };
    var SanitizeHostname = function SanitizeHostname(Endpoint) {
      var hostname = Endpoint.toLowerCase().trim();
      if (hostname.match(/:\/\//)) {
        hostname = hostname.split('://')[1].replace(/\/+$/, '');
      }
      return hostname;
    };

    Object.assign(_this, {
      addServer: function addServer(Endpoint) {
        var _this2 = this;

        var protocol = GetSocketProtocol(Endpoint);
        var hostname = SanitizeHostname(Endpoint);
        var existingServer = Servers.indexOf(hostname);
        if (hostname.length > 0 && existingServer < 0) {
          Servers.push(hostname);
          this.emit('added', hostname);
          new RippledWsClient(protocol + '://' + hostname).then(function (Connection) {
            Connections[hostname] = { hostname: hostname };
            Connections[hostname].connection = Connection;

            var getState = function getState() {
              Connections[hostname].state = Connection.getState();
              _this2.emit('hostinfo', Connections[hostname]);
            };
            getState();
            var stateInterval = setInterval(getState, 2.5 * 1000);

            var subscribeAccounts = function subscribeAccounts() {
              if (Object.keys(WatchAccounts).length > 0) {
                Connection.send({
                  command: 'subscribe',
                  accounts: Object.keys(WatchAccounts)
                });
                // Todo: on catch? Server error?
              }
            };
            subscribeAccounts();

            Connection.on('error', function (a) {
              // Do nothing
              // console.log('Error', hostname, a)
              getState();
            });
            Connection.on('retry', function (a) {
              // Do nothing
              getState();
            });
            Connection.on('close', function (a) {
              // Do nothing
              clearInterval(stateInterval);
            });
            Connection.on('reconnect', function (a) {
              // Do nothing
              getState();
              subscribeAccounts();
            });
            Connection.on('state', function (a) {
              // Do nothing
              getState();
            });
            Connection.on('ledger', function (a) {
              // Do nothing
              if (a.ledger_index > LastLedger) {
                LastLedger = a.ledger_index;
                _this2.emit('ledger', LastLedger);
              }
              getState();
            });
            Connection.on('transaction', function (c) {
              // Do nothing
              if (typeof c.transaction.Account !== 'undefined' && (typeof WatchAccounts[c.transaction.Account] !== 'undefined' || Object.keys(WatchAccounts).length < 1) || typeof c.transaction.Destination !== 'undefined' && (typeof WatchAccounts[c.transaction.Destination] !== 'undefined' || Object.keys(WatchAccounts).length < 1)) {
                RecentTransactions.splice(TX_HISTORY_LENGTH);
                var CurrentTxIndex = RecentTransactions.map(function (r) {
                  return r.Hash;
                }).indexOf(c.transaction.hash);
                if (CurrentTxIndex < 0) {
                  FirstResponders.splice(50);
                  FirstResponders.unshift(hostname);
                  var TxData = {
                    Hash: c.transaction.hash,
                    Data: c,
                    FirstResponder: hostname,
                    SeenBy: [hostname]
                  };
                  RecentTransactions.unshift(TxData);
                  _this2.emit('transaction', TxData);
                } else {
                  RecentTransactions[CurrentTxIndex].SeenBy.push(hostname);
                }
              }
            });
            Connection.on('validation', function (a) {
              // Do nothing
            });
          }).catch(function (error) {
            // Todo
            console.error('Rippled Client error', hostname, error);
          });
        }
      },
      removeServer: function removeServer(Endpoint) {
        // Todo: unwatchen, unbinden, disconnecten, enz.
        var hostname = SanitizeHostname(Endpoint);
        var serverIndex = Servers.indexOf(hostname);
        if (serverIndex > -1) {
          if (typeof Connections[hostname] !== 'undefined') {
            Connections[hostname].connection.close().then(function (closeInfo) {
              console.log('Closed', hostname, closeInfo);
            }).catch(function (error) {
              console.log('Close error', hostname, error);
            });
          }
          Servers.splice(serverIndex, 1);
          this.emit('removed', hostname);
        }
      },
      getRanking: function getRanking() {
        var servers = Object.values(Connections).filter(function (c) {
          return c.state.online && c.state.ledger;
        });
        var hostLength = servers.length;
        var highestLedger = 0;
        var ledgers = servers.map(function (c) {
          return c.state.ledger.last;
        });
        if (ledgers.length > 0) {
          highestLedger = Math.max.apply(Math, ledgers);
        }
        var serverPoints = {};
        servers.forEach(function (s) {
          serverPoints[s.hostname] = 0;
        });
        var getServersOrdered = function getServersOrdered(group, field, factor, reverse) {
          if (typeof factor === 'undefined' || isNaN(parseFloat(factor))) {
            factor = 1;
          }
          var order = servers.sort(function (a, b) {
            return a.state[group][field] > b.state[group][field];
          }).map(function (c) {
            return c.hostname;
          });
          if (typeof reverse !== 'undefined' && reverse) {
            order.reverse();
          }
          var points = {};
          var values = {};
          var prevVal = null;
          var prevI = 0;
          order.forEach(function (c, i) {
            var _i = Connections[c].state[group][field] === prevVal ? prevI : i;
            points[c] = (hostLength - _i - 1) * parseFloat(factor);
            serverPoints[c] += points[c];
            // Todo: points factor per section, eg. ledger is > important than fee, fee > important than latency
            prevVal = Math.ceil(Connections[c].state[group][field]);
            values[c] = prevVal;
            if (_i === i) {
              prevI = i;
            }
          });
          return {
            values: values,
            order: order,
            points: points
          };
        };
        var getLedgerPenalty = function getLedgerPenalty() {
          var points = {};
          var values = {};
          servers.forEach(function (s) {
            var ledgerDiff = highestLedger - s.state.ledger.last;
            points[s.hostname] = ledgerDiff > 2 ? ledgerDiff * -3 : 0;
            if (points[s.hostname] < -20) {
              points[s.hostname] = -20;
            }
            serverPoints[s.hostname] += points[s.hostname];
            values[s.hostname] = ledgerDiff;
          });
          return {
            values: values,
            points: points
          };
        };
        var getAgoPenalty = function getAgoPenalty(group) {
          var points = {};
          var values = {};
          servers.forEach(function (s) {
            points[s.hostname] = s.state[group].secAgo > 8 ? Math.round(s.state[group].secAgo / 4) * -1 : 0;
            if (points[s.hostname] < -20) {
              points[s.hostname] = -20;
            }
            serverPoints[s.hostname] += points[s.hostname];
            values[s.hostname] = Math.ceil(s.state[group].last);
          });
          return {
            values: values,
            points: points
          };
        };
        var getFirstResponder = function getFirstResponder() {
          var points = {};
          var values = {};
          var order = [];
          servers.forEach(function (s) {
            values[s.hostname] = FirstResponders.filter(function (f) {
              return f === s.hostname;
            }).length;
            points[s.hostname] = 0;
            if (FirstResponders.length > 0) {
              points[s.hostname] = Math.ceil(values[s.hostname] / FirstResponders.length * 10);
            }
            serverPoints[s.hostname] += points[s.hostname];
            order.push({
              hostname: s.hostname,
              points: points[s.hostname]
            });
          });
          return {
            values: values,
            points: points,
            order: order.sort(function (a, b) {
              return a.points < b.points;
            }).map(function (c) {
              return c.hostname;
            })
          };
        };
        var getFirstSequentialLedger = function getFirstSequentialLedger() {
          var points = {};
          var values = {};
          var order = [];
          servers.forEach(function (s) {
            var validatedLedgers = s.state.ledger.validated;
            var firstValidLedger = highestLedger;
            if (typeof validatedLedgers === 'string' && validatedLedgers.match(/[0-9]+/)) {
              firstValidLedger = parseInt(s.state.ledger.validated.split(',').reverse()[0].split('-')[0]);
            }
            points[s.hostname] = 0;
            values[s.hostname] = firstValidLedger;
            order.push({
              hostname: s.hostname,
              value: values[s.hostname]
            });
          });
          return {
            values: values,
            points: points,
            order: order.sort(function (a, b) {
              var x = a.value;
              var y = b.value;
              return x < y ? -1 : x > y ? 1 : 0;
            }).map(function (c) {
              return c.hostname;
            })
          };
        };

        return {
          source: {
            uptime: getServersOrdered('server', 'uptime', 2, true),
            latencyLast: getServersOrdered('latencyMs', 'last', 2),
            latencyAvg: getServersOrdered('latencyMs', 'avg', 3),
            firstSeqLedger: getFirstSequentialLedger(),
            ledgerCount: getServersOrdered('ledger', 'count', 2, true),
            feeLast: getServersOrdered('fee', 'last', 1, false),
            feeAvg: getServersOrdered('fee', 'avg', 3, false),
            ledgerDiff: getLedgerPenalty(),
            feeAgo: getAgoPenalty('fee'),
            latencyAgo: getAgoPenalty('latencyMs'),
            firstResp: getFirstResponder()
          },
          highestLedger: highestLedger,
          points: serverPoints,
          ranking: Object.keys(serverPoints).sort(function (a, b) {
            return serverPoints[a] < serverPoints[b];
          })
        };
      },
      subscribeAccount: function subscribeAccount(Account) {
        if (typeof WatchAccounts[Account] === 'undefined') {
          WatchAccounts[Account] = {
            TxCount: 0
          };
          Object.values(Connections).forEach(function (c) {
            c.connection.send({
              command: 'subscribe',
              accounts: [Account]
            });
            // Todo: on catch, server error?
          });
        }
      },
      unsubscribeAccount: function unsubscribeAccount(Account) {
        if (typeof WatchAccounts[Account] !== 'undefined') {
          delete WatchAccounts[Account];
          Object.values(Connections).forEach(function (c) {
            c.connection.send({
              command: 'unsubscribe',
              accounts: [Account]
            });
            // Todo: on catch, server error?
          });
        }
      },
      getTransactions: function getTransactions(Account, CustomOptions) {
        var _this3 = this;

        /**
         * Now: just ask the server with the most history
         * Todo: check ledger index (min/max), depending on forward
         * try to check a faster server > min ledger
         */
        var Options = {
          command: 'account_tx',
          account: Account.trim(),
          ledger_index_min: -1,
          ledger_index_max: -1,
          binary: false,
          limit: 100,
          forward: false,
          marker: null,
          ledger_hash: null,
          ledger_index: null
          // 1. Determine servers with history in range (if ledger limits)
          // 2. Redirect command to getTransactions if detected @ send
          // 3. Prev/Next methods

        };return new Promise(function (resolve, reject) {
          var requestObject = void 0;
          if ((typeof CustomOptions === 'undefined' ? 'undefined' : _typeof(CustomOptions)) === 'object') {
            requestObject = CustomOptions;
          } else if (typeof CustomOptions === 'string') {
            try {
              requestObject = JSON.parse(CustomOptions.trim());
            } catch (e) {
              reject(new Error('Invalid command, could not parse JSON: ' + e.message));
            }
          } else {
            reject(new Error('Invalid command: input type: neither object, string'));
          }

          if ((typeof requestObject === 'undefined' ? 'undefined' : _typeof(requestObject)) === 'object') {
            Object.keys(Options).forEach(function (OptionKey) {
              if (typeof requestObject[OptionKey] !== 'undefined') {
                Options[OptionKey] = requestObject[OptionKey];
              }
            });
          }
          Object.keys(Options).forEach(function (k) {
            if (Options[k] === null) {
              delete Options[k];
            }
          });

          var serverList = [];
          var searchStartingAt = null;
          if (Options.forward && Options.marker !== null && _typeof(Options.marker) === 'object' && typeof Options.marker.ledger !== 'undefined') {
            searchStartingAt = Options.marker.ledger;
          } else if (typeof Options.ledger_index_min !== 'undefined' && Options.ledger_index_min >= 32570) {
            searchStartingAt = Options.ledger_index_min;
          }

          if (searchStartingAt !== null) {
            var rankingServers = _this3.getRanking().source.firstSeqLedger;
            Object.keys(rankingServers.values).forEach(function (r) {
              // console.log(r + ' has ledgers starting at ' + rankingServers.values[r], searchStartingAt)
              if (rankingServers.values[r] < searchStartingAt) {
                serverList.push(r);
                // console.log('   Push ', r)
              }
            });
            if (serverList.length < 1) {
              serverList = rankingServers.order;
            } else {
              console.log('Query ServerList ordered health with sequential history starting at ledger_index_min/marker (ledger)', searchStartingAt, serverList);
            }
          } else {
            serverList = _this3.getRanking().source.firstSeqLedger.order;
            console.log('Query ServerList ordered at first available ledger (no marker (ledger)) given', serverList);
          }

          _this3.send(Options, {
            serverTimeout: 2500,
            overallTimeout: 7500,
            fixedServers: serverList
          }).then(function (r) {
            var fetchMoreTransactions = null;
            if (typeof r.response.marker !== 'undefined' && r.response.marker !== null) {
              fetchMoreTransactions = function fetchMoreTransactions() {
                return _this3.getTransactions(Options.account, Object.assign(requestObject, {
                  marker: r.response.marker
                }));
              };
            }
            resolve({
              server: {
                host: r.server,
                preferenceIndex: r.waterfallSeq
              },
              account: Options.account,
              txCount: typeof r.response.transactions !== 'undefined' ? r.response.transactions.length : 0,
              transactions: typeof r.response.transactions !== 'undefined' && Array.isArray(r.response.transactions) ? r.response.transactions : [],
              more: fetchMoreTransactions,
              replyMs: r.response.__replyMs
            });
          }).catch(function (e) {
            reject(e);
          });
        });
      },
      send: function send(Command, CustomOptions) {
        var _this4 = this;

        /**
         * If a response contains an error of one of these types, do not try again:
         * another server will 100% return the same response. Don't spill load
         */
        var dontRetryErrors = ['unknownCmd', 'invalidParams', 'actMalformed', 'lgrIdxsInvalid'];
        var nonRecoverableError = false;
        var responseSent = false;

        var Options = {
          idempotency: null,
          serverTimeout: 1000,
          overallTimeout: 5000,
          fixedServers: []
        };
        if ((typeof CustomOptions === 'undefined' ? 'undefined' : _typeof(CustomOptions)) === 'object') {
          Object.keys(Options).forEach(function (OptionKey) {
            if (typeof CustomOptions[OptionKey] !== 'undefined') {
              Options[OptionKey] = CustomOptions[OptionKey];
            }
          });
        }
        return new Promise(function (resolve, reject) {
          var requestObject = void 0;
          if ((typeof Command === 'undefined' ? 'undefined' : _typeof(Command)) === 'object') {
            requestObject = Command;
          } else if (typeof Command === 'string') {
            try {
              requestObject = JSON.parse(Command.trim());
            } catch (e) {
              reject(new Error('Invalid command, could not parse JSON: ' + e.message));
            }
          } else {
            reject(new Error('Invalid command: input type: neither object, string'));
          }

          if (requestObject) {
            var queryServerId = 0;
            var requestsSent = 0;
            var failures = [];

            /**
             * Query most healthy server, except if account_tx (transactions) command,
             * in that case prefer more history
             */
            var queryServers = _this4.getRanking().ranking;
            if (Array.isArray(Options.fixedServers)) {
              var filteredServers = Options.fixedServers.filter(function (s) {
                return queryServers.indexOf(s) > -1;
              });
              if (filteredServers.length > 0) {
                queryServers = filteredServers;
              }
            }
            var callServer = function callServer(Server) {
              console.log('Calling server [' + Server + ']');
              return new Promise(function (resolve, reject) {
                // Todo: call rippled connection
                var serverId = queryServers.indexOf(Server);
                requestsSent++;
                Connections[queryServers[serverId]].connection.send(requestObject).then(function (response) {
                  if (typeof response.error !== 'undefined') {
                    if (dontRetryErrors.indexOf(response.error) > -1) {
                      nonRecoverableError = true;
                    }
                    // Server actively rejected reply
                    var message = response.error_message + ' #' + response.error_code + ' - ' + response.error;
                    // Recoverable error, maybe another server can resolve
                    reject(new Error(Server + ' reported: ' + message));
                    failures.push({ server: Server, type: 'soft', error: message });
                  } else {
                    resolve({
                      response: response,
                      server: Server,
                      waterfallSeq: serverId,
                      requestsSent: requestsSent,
                      idempotency: Options.idempotency
                    });
                  }
                }).catch(function (error) {
                  failures.push({ server: Server, type: 'hard', error: error.message });
                  reject(error);
                });
              });
            };
            var run = function run() {
              return new Promise(function (resolve, reject) {
                var callTimeout = isNaN(parseInt(Options.serverTimeout)) ? 1000 : parseInt(Options.serverTimeout);
                var callNextInterval = void 0;
                var initCallInterval = function initCallInterval() {
                  clearInterval(callNextInterval);
                  callNextInterval = setInterval(callNext, callTimeout);
                  callNext();
                };
                var callNext = function callNext() {
                  callServer(queryServers[queryServerId]).then(function (r) {
                    clearInterval(callNextInterval);
                    resolve(r);
                  }).catch(function (e) {
                    console.log('callServerCatch', e);
                    if (nonRecoverableError) {
                      clearInterval(callNextInterval);
                      reject(new Error('Non Recoverable Error (no retry): ' + failures[0].server + ': ' + failures[0].error + ' (' + failures[0].type + ')'));
                    } else {
                      if (queryServerId < queryServers.length) {
                        // If not the last: call new server immediately
                        if (!responseSent) {
                          initCallInterval();
                        }
                      } else if (requestsSent === failures.length) {
                        var failureString = failures.map(function (f) {
                          return f.server + ': ' + f.error + ' (' + f.type + ')';
                        }).join(', ');
                        reject(new Error('All servers reported errors: ' + failureString));
                      }
                    }
                  });

                  queryServerId++;
                  if (queryServerId === queryServers.length) {
                    clearInterval(callNextInterval);
                  }
                };
                initCallInterval();
              });
            };

            var overallTimeoutMs = isNaN(parseInt(Options.overallTimeout)) ? 1000 : parseInt(Options.overallTimeout);
            var overallTimeout = setTimeout(function () {
              reject(new Error('Overall timeout reached after ' + overallTimeoutMs + ' ms'));
            }, overallTimeoutMs);

            run().then(function (response) {
              Object.assign(response, {
                failures: failures
              });
              // console.log('< Response', response)
              clearTimeout(overallTimeout);
              responseSent = true;
              resolve(response);
            }).catch(function (error) {
              clearTimeout(overallTimeout);
              responseSent = true;
              reject(error);
            });
          }
        });
      },
      getConnection: function getConnection() {
        var servers = this.getRanking().ranking;
        if (Array.isArray(servers) && servers.length > 0) {
          return Connections[servers[0]].connection;
        } else {
          throw new Error('No connections available');
        }
      },
      getConnections: function getConnections() {
        var _this5 = this;

        return Object.values(Connections).map(function (c) {
          return {
            connection: c.connection,
            hostname: c.hostname,
            state: c.state,
            preference: _this5.getRanking().ranking.indexOf(c.hostname)
          };
        }).filter(function (c) {
          return c.preference > -1;
        }).sort(function (a, b) {
          return a.preference > b.preference;
        });
      }
    });
    return _this;
  }

  return RippledWsClientPool;
}(EventEmitter);

module.exports = RippledWsClientPool;

},{"events":1,"rippled-ws-client":2}]},{},[]);
