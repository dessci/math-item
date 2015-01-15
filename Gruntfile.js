module.exports = function(grunt) {
    var name = 'math-ui-v0.1';
    
    grunt.initConfig({
        typescript: {
            core: {
                src: ['src/core/*.ts'],
                dest: 'dist/math-ui-core.js',
                options: {
                    target: 'es3',
                    sourceMap: true,
                    declaration: true
                }
            },
            vanilla: {
                src: ['src/vanilla/*.ts'],
                dest: 'dist/math-ui-vanilla.js',
                options: {
                    target: 'es3',
                    sourceMap: true,
                    declaration: true
                }
            },
            bootstrap: {
                src: ['src/bootstrap/*.ts'],
                dest: 'dist/math-ui-bootstrap.js',
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
        /*uglify: {
            dist: {
                src: ['dist/' + name + '.js'],
                dest: 'dist/' + name + '.min.js'
            }
        },*/
        sass: {
            vanilla: {
                files: {
                    'dist/math-ui-vanilla.css': 'src/vanilla/math-ui-vanilla.scss'
                }
            },
            bootstrap: {
                files: {
                    'dist/math-ui-bootstrap.css': 'src/bootstrap/math-ui-bootstrap.scss'
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
            jsCore: {
                files: ['src/core/*.ts'],
                tasks: ['typescript:core']
            },
            jsVanilla: {
                files: ['src/vanilla/*.ts'],
                tasks: ['typescript:vanilla']
            },
            jsBootstrap: {
                files: ['src/bootstrap/*.ts'],
                tasks: ['typescript:bootstrap']
            },
            cssVanilla: {
                files: ['src/vanilla/*.scss'],
                tasks: ['sass:vanilla']
            },
            cssBootstrap: {
                files: ['src/bootstrap/*.scss'],
                tasks: ['sass:bootstrap']
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

    grunt.registerTask('default', ['clean', 'typescript', 'sass'/*, 'uglify'*/]);
    grunt.registerTask('serve', ['connect', 'watch']);

};
