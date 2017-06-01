/**
 * Created by Mick on 31.05.2017.
 */
const assert = require('assert');

var Entity = require('./../server/serverentity');
// tutorial https://mochajs.org/
var testGame = require('./test_game.json');

describe("ServerEntity", function(){

/*
    before(function() {
        // runs before all tests in this block
    });

    after(function() {
        // runs after all tests in this block
    });

    beforeEach(function() {
        // runs before each test in this block
    });

    afterEach(function() {
        // runs after each test in this block
    });*/



    describe('CreateBaseEntity', function() {
        it('should create an instance of BaseEntityData', function() {
            new Entity.BaseEntityData(testGame.unstacked[0],testGame.object_def);
            assert.ok(true);
        });
        it('should create an instance of ServerEntity', function() {
            new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def);
            assert.ok(true);
        });

        it('should create an instance of ServerEntityStack', function() {
            new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.ok(true);
        });

        it('should create an instance of ServerEntity (with dice)', function() {
            new Entity.ServerEntity(testGame.unstacked[1],testGame.object_def);
            assert.ok(true);
        });

        it('should give the correct complementary site (dice)', function() {
            var entity = new Entity.ServerEntity(testGame.unstacked[1],testGame.object_def);
            assert.equal(entity.complementarySide,3);
        });

        it('should give the correct complementary site (wordcard)', function() {
            var entity = new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def);
            assert.equal(entity.complementarySide,1);
            entity.turn("next");
            assert.equal(entity.complementarySide,0);
        });

        it('should give the correct site after previous turn', function() {
            var entity = new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def);
            entity.turn("previous");
            assert.equal(entity.surfaceIndex,1);
        });

        it('dice should have current site after turning with index', function() {
            var entity = new Entity.ServerEntity(testGame.unstacked[1],testGame.object_def);
            entity.turn(4);
            assert.equal(entity.surfaceIndex,4);
            entity.turn(16);
            assert.equal(entity.surfaceIndex,5);
            entity.turn(-3);
            assert.equal(entity.surfaceIndex,0);
        });

        it('should pop an item from a stack', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            var e = stack.popContent();
            assert.equal(e instanceof Entity.ServerEntity,true);
            assert.equal(stack.content.length,2);
        });

        it('should pop an item from a stack', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            stack.popContent();
            stack.popContent();
            stack.popContent();
            assert.equal(stack.content.length,0);
            assert.equal(stack.popContent(),null);
        });

        it('stack should turn correctly-> surfaceIndex should change in correct behaviour', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.equal(stack.surfaceIndex,1);
            stack.turn("next");

            assert.equal(stack.surfaceIndex,0);
            stack.turn("next");
            assert.equal(stack.surfaceIndex,1);
        });

        it('stack should show the correct surfaces after creating', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            var surfaces = stack.surfaces;

            assert.equal(surfaces[0].texture,"back.png");
            assert.equal(surfaces[1].texture,"c2.png");
        });

        it('stack should show the correct surfaces after turning', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            stack.turn("next");

            var surfaces = stack.surfaces;
            assert.equal(surfaces[0].texture,"c2.png");
            assert.equal(surfaces[1].texture,"back.png");
        });

        it('stack should have correct content length after pushing entities', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.equal(stack.content.length,3);
            stack.pushContent(new Entity.BaseEntityData(testGame.unstacked[0],testGame.object_def));
            assert.equal(stack.content.length,4);
            stack.pushContent(new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def));
            assert.equal(stack.content.length,5);
        });

        it('stack should have correct content length after merging with other stack', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.equal(stack.content.length,3);

            var stack2 = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.equal(stack2.content.length,3);

            stack.pushContent(stack2);
            assert.equal(stack.content.length,6);
        });

        it('stack should not accept entity of wrong type', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.equal(stack.content.length,3);
            stack.pushContent(new Entity.ServerEntity(testGame.unstacked[1],testGame.object_def));
            assert.equal(stack.content.length,3);
        });

        it('stack should not accept unstackable entity', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.equal(stack.content.length,3);
            stack.pushContent(new Entity.ServerEntity(testGame.unstacked[3],testGame.object_def));
            assert.equal(stack.content.length,3);
        });
    });
});