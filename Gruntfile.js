module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dist: ['dist'],
            temps: ['src/math-item.js*', 'src/handlers.js*']
        },
        concat: {
            math_item: {
                src: ['src/promise-polyfill.js', 'dist/math-item.js'],
                dest: 'dist/math-item-element.js'
            }
        },
        typescript: {
            math_item: {
                src: ['src/math-item.ts', 'src/handlers.ts'],
                dest: 'dist/math-item.js',
                options: {
                    target: 'es3',
                    sourceMap: true,
                    declaration: true
                }
            },
        },
        uglify: {
            math_item: {
                files: {
                    'dist/math-item-element.min.js': ['dist/math-item-element.js']
                }
            }
        }
    });
 
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['clean', 'typescript', 'concat', 'uglify']);

};
