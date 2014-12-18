/// <reference path="../typings/mocha.d.ts" />
/// <reference path="../typings/expect.js.d.ts" />
/// <reference path="../dist/math-ui-v0.1.d.ts" />
var _ = MathUI.getUtils();
describe('MathUI utils', function () {
    var obj = { 'a': 'b', 'c': 'd', 'e': 'f' };
    var fakeArray = { length: 3, 0: 'a', 1: 'b', 2: 'c', 'other': 'stuff' };
    describe('each', function () {
        it('native array', function () {
            var result = [];
            _.each(['a', 'b', 'c'], function (value, k) {
                result.push({ value: value, index: k });
            });
            expect(result).to.eql([{ value: 'a', index: 0 }, { value: 'b', index: 1 }, { value: 'c', index: 2 }]);
        });
        it('array-like object', function () {
            var result = [];
            _.each(fakeArray, function (value, k) {
                result.push({ value: value, index: k });
            });
            expect(result).to.eql([{ value: 'a', index: 0 }, { value: 'b', index: 1 }, { value: 'c', index: 2 }]);
        });
        it('object', function () {
            var result = {};
            _.each(obj, function (value, key) {
                result[key] = value;
            });
            expect(result).to.eql(obj);
        });
    });
    describe('map', function () {
        it('array', function () {
            var result = _.map([2, 3, 4, 5], function (value, index) { return value * (index + 1); });
            expect(result).to.eql([1 * 2, 2 * 3, 3 * 4, 4 * 5]);
        });
        it('object', function () {
            var L = _.map(obj, function (value, key) { return [key, value]; });
            var result = {};
            for (var k = 0; k < L.length; k++)
                result[L[k][0]] = L[k][1];
            expect(result).to.eql(obj);
        });
    });
    describe('filter', function () {
        it('array', function () {
            var result = _.filter([1, 2, 3, 4], function (value, index) { return value % 2 === 0; });
            expect(result).to.eql([2, 4]);
        });
        it('object', function () {
            var result = _.filter(obj, function (value, key) { return key === 'a' || key === 'e'; });
            expect(result).to.eql([obj['a'], obj['e']]);
        });
    });
    describe('indexOf', function () {
        it('not found returns -1', function () {
            expect(_.indexOf([], 1)).to.be(-1);
            expect(_.indexOf([1, 2, 3], 4)).to.be(-1);
            expect(_.indexOf([1, 2, 3], '2')).to.be(-1);
        });
        it('find item', function () {
            expect(_.indexOf([1, 2, 3], 2)).to.be(1);
            expect(_.indexOf(['a', 'b', 'c'], 'c')).to.be(2);
        });
    });
    describe('contains', function () {
        it('not found', function () {
            expect(_.contains([], 1)).to.be(false);
            expect(_.contains([1, 2, 3], 4)).to.be(false);
            expect(_.contains([1, 2, 3], '2')).to.be(false);
        });
        it('found', function () {
            expect(_.contains([1, 2, 3], 2)).to.be(true);
            expect(_.contains(['a', 'b', 'c'], 'c')).to.be(true);
        });
    });
    describe('difference', function () {
        it('difference', function () {
            expect(_.difference([1, 2, 3, 4], [1, 3, 5])).to.eql([2, 4]);
            expect(_.difference([], [1, 3, 5])).to.eql([]);
            expect(_.difference([1, 3, 5], [])).to.eql([1, 3, 5]);
        });
    });
    describe('union', function () {
        it('union', function () {
            expect(_.union([1, 2, 3, 4], [1, 3, 5]).sort()).to.eql([1, 2, 3, 4, 5]);
            expect(_.union([], [1, 3, 5]).sort()).to.eql([1, 3, 5]);
            expect(_.union([1, 3, 5], []).sort()).to.eql([1, 3, 5]);
        });
    });
    describe('without', function () {
        it('without', function () {
            expect(_.without([1, 2, 3], 1)).to.eql([2, 3]);
            expect(_.without([1, 2, 3], 4)).to.eql([1, 2, 3]);
        });
    });
    describe('isArray', function () {
        it('native array yes', function () {
            expect(_.isArray([1, 2])).to.be(true);
        });
        it('object no', function () {
            expect(_.isArray(obj)).to.be(false);
        });
        it('fake array no', function () {
            expect(_.isArray(fakeArray)).to.be(false);
        });
    });
    describe('toArray', function () {
        it('native array', function () {
            expect(_.toArray([1, 2, 3])).to.eql([1, 2, 3]);
        });
        it('fake array', function () {
            expect(_.toArray(fakeArray)).to.eql(['a', 'b', 'c']);
        });
    });
    describe('trim', function () {
        it('trim', function () {
            expect(_.trim('something')).to.be('something');
            expect(_.trim('  foo')).to.be('foo');
            expect(_.trim('foo   ')).to.be('foo');
            expect(_.trim(' foo   ')).to.be('foo');
            expect(_.trim(' \r foo \n \t ')).to.be('foo');
        });
    });
    describe('words', function () {
        it('words', function () {
            expect(_.words('')).to.eql([]);
            expect(_.words('foo')).to.eql(['foo']);
            expect(_.words(' foo  \r')).to.eql(['foo']);
            expect(_.words(' foo  \n bar \t ')).to.eql(['foo', 'bar']);
        });
    });
});
