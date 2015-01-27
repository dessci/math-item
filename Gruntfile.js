module.exports = function(grunt) {
    var name = 'math-ui-v0.1';
    
    grunt.initConfig({
        /*typescript: {
            core: {
                src: ['src/core/*.ts'],
                dest: 'dist/math-ui-core.js',
                options: {
                    target: 'es3',
                    sourceMap: true,
                    declaration: true
                }
            }
        },
        sass: {
            bootstrap: {
                files: {
                    'dist/math-ui-bootstrap.css': 'src/bootstrap/math-ui-bootstrap.scss'
                }
            }
        },*/
        connect: {
            root: {
                options: {
                    port: 8080,
                    base: './'
                }
            }
        },
        /*watch: {
        },*/
        clean: {
            dist: ['dist']
        }
    });
 
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['clean'/*, 'typescript', 'sass'*/]);
    grunt.registerTask('serve', ['connect'/*, 'watch'*/]);

};
