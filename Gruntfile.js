module.exports = function(grunt) {
    //var name = 'math-ui-v0.1';
    
    grunt.initConfig({
        typescript: {
            'math-item': {
                src: ['src/math-item.ts', 'src/handlers.ts'],
                dest: 'dist/math-item.js',
                target: 'es3',
                sourceMap: true,
                declaration: true
            }
        },
        sass: {
            examples: {
                files: {
                    'examples/wrapping.css': 'examples/wrapping.scss'
                }
            }
        },
        copy: {
            webcomponents: {
                src: 'node_modules/webcomponents.js/CustomElements.js',
                dest: 'dist/CustomElements.js',
                options: {
                    process: function (content) {
                        return 'if (Date.now && Object.defineProperty && Array.prototype.forEach && Array.prototype.indexOf && window.addEventListener) {\n' +
                            content.replace(/\.(import|instanceof|extends)\b/g, "['$1']") +
                            '}\n';
                    }
                }
            },
            es6promise: {
                src: 'src/promise-polyfill.js',
                dest: 'dist/promise-polyfill.js'
            }
        },
        connect: {
            root: {
                options: {
                    port: 8080,
                    base: './'
                }
            }
        },
        watch: {
            'math-item': {
                files: ['src/*-utils.ts', 'src/handlers.ts', 'src/math-item.ts'],
                tasks: ['typescript:math-item']
            },
            examples: {
                files: ['examples/*.scss'],
                tasks: ['sass:examples']
            },
            es6promise: {
                files: 'src/promise-polyfill.js',
                tasks: ['copy:es6promise']
            }
        },
        clean: {
            examples: ['examples/*.css'],
            dist: ['dist']
        }
    });
 
    grunt.loadNpmTasks('grunt-typescript');
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['clean', 'typescript', 'sass', 'copy']);
    grunt.registerTask('serve', ['connect', 'watch']);

};
