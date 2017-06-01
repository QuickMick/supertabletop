/**
 * Created by Mick on 31.05.2017.
 */
"use strict";
const assert = require('assert');

var Entity = require('./../server/serverentity');
// tutorial https://mochajs.org/
var testGame = require('./test_game.json');

describe("Entities for server:", function(){

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

    describe('BaseEntityData', function() {
        it('should be instantiated correctly', function() {
            new Entity.BaseEntityData(testGame.unstacked[0],testGame.object_def);
            assert.ok(true);
        });
    });

    describe('ServerEntity', function() {
        it('should created correctly', function() {
            new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def);
            assert.ok(true);
        });

        it('should created correctly (with dice)', function() {
            new Entity.ServerEntity(testGame.unstacked[1],testGame.object_def);
            assert.ok(true);
        });

        it('should give the correct complementary site (dice)', function() {
            var entity = new Entity.ServerEntity(testGame.unstacked[1],testGame.object_def);
            assert.equal(entity.complementarySide,3);
            entity.surfaces.pop();

            entity.surfaceIndex=0;
            assert.equal(entity.complementarySide,3);

            entity.surfaces.pop();
            entity.surfaceIndex=0;
            assert.equal(entity.complementarySide,2);

            entity.surfaceIndex=2;
            assert.equal(entity.complementarySide,0);

            entity.surfaces.pop();
            entity.surfaceIndex=0;
            assert.equal(entity.complementarySide,2);

            entity.surfaces.pop();
            entity.surfaceIndex=1;
            assert.equal(entity.complementarySide,0);
        });

        it('should give the correct complementary site', function() {
            var entity = new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def);
            entity.surfaceIndex=0;
            assert.equal(entity.complementarySide,1);
            entity.surfaceIndex=1;
            assert.equal(entity.complementarySide,0);
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
    });

    describe('ServerEntityStack', function() {
        it('should create an instance of ServerEntityStack out of basedata from the test_game', function() {
            new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.ok(true);
        });

        it('should take an ServerEntity as parameter and positionize the new stack on the right position', function() {

            var e = new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def);
            e.position.x = 200;
            e.position.y = 333;

            var stack = new Entity.ServerEntityStack(e);
            assert.equal(stack.position.x,200);
            assert.equal(stack.position.y,333);
        });

        it('should take just an object with a content field as parameter', function() {

            var e = new Entity.ServerEntity(testGame.unstacked[0],testGame.object_def);
            e.rotation=1.2;


            var stack = new Entity.ServerEntityStack({content:e});


            assert.equal(stack.position.x,200);
            assert.equal(stack.position.y,100);

            assert.equal(stack.width,e.width);
            assert.equal(stack.height,e.height);
            assert.equal(stack.rotation,e.rotation);

            e.rotation=1.3;
            stack = new Entity.ServerEntityStack({content:[e]});
            assert.equal(stack.position.x,200);
            assert.equal(stack.position.y,100);

            assert.equal(stack.width,e.width);
            assert.equal(stack.height,e.height);
            assert.equal(stack.rotation,e.rotation);

        });


        it('should pop an item', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            var e = stack.popContent();
            assert.equal(e instanceof Entity.ServerEntity,true);
            assert.equal(stack.content.length,2);
        });

        it('should pop more items and return null if empty', function() {
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
        it('stack should split correctly', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            assert.equal(stack.content.length,3);
            var result = stack.split(2);
            assert.equal(result.content.length,2);
            assert.equal(stack.content.length,1);
            assert.equal(stack.split(1),null);
            assert.equal(stack.content.length,1);
        });


        it('stack should have correct content after pushing stack', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            var stack2 = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);

            stack.pushContent(stack2);

            assert.equal(stack.content.length,6);
            assert.equal(stack.content[0].surfaces[0].texture,"c1.png");
            assert.equal(stack.content[1].surfaces[0].texture,"c1.png");
            assert.equal(stack.content[2].surfaces[0].texture,"c2.png");

            assert.equal(stack.content[3].surfaces[0].texture,"c1.png");
            assert.equal(stack.content[4].surfaces[0].texture,"c1.png");
            assert.equal(stack.content[5].surfaces[0].texture,"c2.png");
        });

        it('stack should have correct content after pushing turned stack', function() {
            var stack = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);
            var stack2 = new Entity.ServerEntityStack(testGame.stacks[0],testGame.object_def);

            stack2.turn();

            stack.pushContent(stack2);

            assert.equal(stack.content.length,6);
            assert.equal(stack.content[0].surfaces[0].texture,"c1.png");
            assert.equal(stack.content[1].surfaces[0].texture,"c1.png");
            assert.equal(stack.content[2].surfaces[0].texture,"c2.png");

            assert.equal(stack.content[3].surfaces[0].texture,"c2.png");
            assert.equal(stack.content[4].surfaces[0].texture,"c1.png");
            assert.equal(stack.content[5].surfaces[0].texture,"c1.png");

        });

    });
});
