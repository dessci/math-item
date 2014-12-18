module.exports = function(grunt) {
    var name = 'math-ui-v0.1';
    
    grunt.initConfig({
        typescript: {
            dist: {
                src: ['src/typescript/*.ts'],
                dest: 'dist/' + name + '.js',
                options: {
                    target: 'es3',
                    sourceMap: true,
                    declaration: true
                }
            },
            tests: {
                src: ['test/*.ts'],
                dest: '.',
                options: {
                    target: 'es3'
                }
            }
        },
        uglify: {
            dist: {
                src: ['dist/' + name + '.js'],
                dest: 'dist/' + name + '.min.js'
            }
        },
        sass: {
            dist: {
                files: {
                    'dist/math-ui-v0.1.css': 'src/sass/math-ui.scss'
                }
            },
            examples: {
                files: {
                    'examples/wrapping.css': 'examples/wrapping.scss'
                }
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
            srcJs: {
                files: ['src/typescript/*.ts'],
                tasks: ['typescript:dist']
            },
            srcCss: {
                files: ['src/sass/*.scss'],
                tasks: ['sass:dist']
            },
            examples: {
                files: ['examples/*.scss'],
                tasks: ['sass:examples']
            },
            tests: {
                files: ['test/*.ts'],
                tasks: ['typescript:tests']
            }
        },
        clean: {
            examples: ['examples/*.css'],
            tests: ['test/*.js'],
            dist: ['dist']
        }
    });
 
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['clean', 'typescript', 'sass', 'uglify']);
    grunt.registerTask('serve', ['connect', 'watch']);

};
