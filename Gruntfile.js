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
                options: {
                    target: 'es3',
                    sourceMap: true,
                    declaration: true
                }
            },
        },
        watch: {
            math_item: {
                files: ['src/math-item.ts'],
                tasks: ['typescript:math_item']
            }
        }
    });
 
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.registerTask('default', ['clean', 'typescript']);
    grunt.registerTask('serve', ['connect', 'watch']);

};
