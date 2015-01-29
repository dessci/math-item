module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dist: ['dist'],
        },
        typescript: {
            math_item: {
                src: ['src/handlers.ts'],
                dest: 'dist/math-item-element.js',
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
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['clean', 'typescript', 'uglify']);

};
