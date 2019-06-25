const assert = require('assert');
const Plugger = require('../index');

describe('The Plugger class', function() {
  it('should be a class (Object)', function() {
    assert.strictEqual(Plugger instanceof Object, true);
  });
  it('should have \'getName\' method', function() {
    assert.strictEqual(Plugger.prototype.getName instanceof Function, true);
  });
  it('should have \'setName\' method', function() {
    assert.strictEqual(Plugger.prototype.setName instanceof Function, true);
  });
  it('should have \'getParent\' method', function() {
    assert.strictEqual(Plugger.prototype.getParent instanceof Function, true);
  });
  it('should have \'setParent\' method', function() {
    assert.strictEqual(Plugger.prototype.setParent instanceof Function, true);
  });
  it('should have \'getPlugs\' method', function() {
    assert.strictEqual(Plugger.prototype.getPlugs instanceof Function, true);
  });
  it('should have \'addPlug\' method', function() {
    assert.strictEqual(Plugger.prototype.addPlug instanceof Function, true);
  });
  it('should have \'removePlug\' method', function() {
    assert.strictEqual(Plugger.prototype.removePlug instanceof Function, true);
  });
  it('should have \'getPlug\' method', function() {
    assert.strictEqual(Plugger.prototype.getPlug instanceof Function, true);
  });
  it('should have \'getRequiredPlugs\' method', function() {
    assert.strictEqual(Plugger.prototype.getRequiredPlugs instanceof Function, true);
  });
  it('should have \'removeRequiredPlug\' method', function() {
    assert.strictEqual(Plugger.prototype.removeRequiredPlug instanceof Function, true);
  });
  it('should have \'requirePlug\' method', function() {
    assert.strictEqual(Plugger.prototype.requirePlug instanceof Function, true);
  });
  it('should have \'setInit\' method', function() {
    assert.strictEqual(Plugger.prototype.setInit instanceof Function, true);
  });
  it('should have \'initPlug\' method', function() {
    assert.strictEqual(Plugger.prototype.initPlug instanceof Function, true);
  });
});

var parent = new Plugger('parent');
var children = new Plugger('children');
var children_same_name = new Plugger('children');
var children2 = new Plugger('children2');
var required_plug = new Plugger('required');

describe('The Plugger instance', function() {
  it('should be able to return a correct name (getName)', function() {
    assert.strictEqual(parent.getName(), 'parent');
  });
  it('should be able to change name (setName)', function() {
    parent.setName('new_name');
    assert.strictEqual(parent.getName(), 'new_name');
  });
  it('should be able to add other Plug from instance (addPlug)', function() {
    assert.strictEqual(parent.addPlug(children), true);
    assert.strictEqual(parent.addPlug(children2), true);
    assert.strictEqual(children.getParent(), parent);
  });
  it('should be able to add other Plug from path (addPlug)', function() {
    assert.strictEqual(parent.addPlug(__dirname + '/child_plug'), true);
  });
  it('shouldn\'t be able to add other Plug with the same name as another inserted Plug (addPlug)', function() {
    var result;
    try {
      parent.addPlug(children_same_name);
      result = 'Plug inserted'
    }
    catch(err) {
      result = 'Error thrown'
    }
    assert.strictEqual(result, 'Error thrown');
  });

  it('should be able to get inserted Plug (getPlug)', function() {
    assert.strictEqual(parent.getPlug('children'), children);
  });

  it('should be able to require a Plug (requirePlug)', function() {
    assert.strictEqual(parent.requirePlug('required'), true);
  });

  it('should be able to remove a required Plug (removeRequiredPlug)', function() {
    parent.removeRequiredPlug('required');
    assert.deepStrictEqual(parent.getRequiredPlugs(), []);
  });

  it('should be able to set init function and execute it (setInit & initPlug)', function() {
    var children3 = new Plugger('children_test');
    var test_sting = "Init function not executed"
    children3.setInit(function() {test_sting = 'Init function executed'})
    parent.addPlug(children3);
    assert.strictEqual(test_sting, 'Init function executed');
  });
});
