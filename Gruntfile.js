module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dist: ['dist'],
        },
        connect: {
            root: {
                options: {
                    port: 8080,
                    base: './'
                }
            }
        },
        typescript: {
            math_item: {
                src: ['src/math-item.ts'],
                dest: 'dist/math-item.js',
                options: { target: 'es3', sourceMap: true, declaration: true }
            },
            mathjax_tex: {
                src: ['src/mathjax-tex.ts'],
                dest: 'dist/mathjax-tex.js',
                options: { target: 'es3', sourceMap: true }
            },
            mathjax_mml: {
                src: ['src/mathjax-mml.ts'],
                dest: 'dist/mathjax-mml.js',
                options: { target: 'es3', sourceMap: true }
            },
            native_mml: {
                src: ['src/native-mml.ts'],
                dest: 'dist/native-mml.js',
                options: { target: 'es3', sourceMap: true }
            },
            eqnstore_source: {
                src: ['src/eqnstore-source.ts'],
                dest: 'dist/eqnstore-source.js',
                options: { target: 'es3', sourceMap: true }
            },
        },
        watch: {
            math_item: {
                files: ['src/utils.ts', 'src/math-item.ts'],
                tasks: ['typescript:math_item']
            },
            mathjax_tex: {
                files: ['dist/math-item.d.ts', 'src/mathjax-tex.ts'],
                tasks: ['typescript:mathjax_tex']
            },
            mathjax_mml: {
                files: ['dist/math-item.d.ts', 'src/mathjax-mml.ts'],
                tasks: ['typescript:mathjax_mml']
            },
            native_mml: {
                files: ['dist/math-item.d.ts', 'src/native-mml.ts'],
                tasks: ['typescript:native_mml']
            },
            eqnstore_source: {
                files: ['dist/math-item.d.ts', 'src/eqnstore-source.ts'],
                tasks: ['typescript:eqnstore_source']
            }
        }
    });
 
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.registerTask('default', ['clean', 'typescript:math_item', 'typescript:mathjax_tex',
        'typescript:mathjax_mml', 'typescript:native_mml', 'typescript:eqnstore_source']);
    grunt.registerTask('serve', ['connect', 'watch']);

};
