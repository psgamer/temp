/*
    Отдельные таски:
    1. Сжатие картинок
    2. Спрайты
        - обычные
        - Ретина
    3. Компилинг продакшена
        - Мини версия
        - Развернутая без app
*/


var gulp       = require('gulp'), // Подключаем Gulp
    rigger       = require('gulp-rigger'), // Собираем html куски
    sass         = require('gulp-sass'), //Подключаем Sass пакет,
    browserSync  = require('browser-sync'), // Подключаем Browser Sync
    concat       = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
    uglify       = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
    cssnano      = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
    rename       = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
    del          = require('del'), // Подключаем библиотеку для удаления файлов и папок
    imagemin     = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
    pngquant     = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
    cache        = require('gulp-cache'), // Подключаем библиотеку кеширования
    header       = require('gulp-header'), // Авторство вначале файлов
    autoprefixer = require('gulp-autoprefixer'), // Подключаем библиотеку для автоматического добавления префиксов
    spritesmith  = require('gulp.spritesmith'), // Библиотека работы со спрайтами
    sourcemaps   = require('gulp-sourcemaps'), // Карты
    pkg          = require('./package.json'); // Берет информацию из файла package.json

var banner = ['/**',
              ' * <%= pkg.description %>',
              ' * @version v<%= pkg.version %>',
              ' * @developer Roman Shulhin http://www.shulhin.ru/',
              ' * @site http://www.shulhin.ru/',
              ' * @email roman.shulhin@gmail.com',
              ' */',
              ''].join('\n');


// Спрайты
gulp.task('sprite', function() {
    var spriteData = gulp.src('app/img/sprite/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        imgPath: '../img/sprite.png',
        cssName: 'sprite.css',
        'padding': 15
    }));
    spriteData.img.pipe(gulp.dest('app/img'));
    spriteData.css
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest('app/css'));
});


gulp.task('scss', function(){ // Создаем таск Sass
    return gulp.src([
            'app/scss/table.scss',
            'app/libs/normalize-css/normalize.css',
            'app/libs/bootstrap-grid-sass/bootstrap-grid-sass.css',
            'app/css/magnific-popup.css',
            'app/scss/main.scss']) // Берем источник
        .pipe(sourcemaps.init())
        .pipe(sass()) // Преобразуем Sass в CSS посредством gulp-sass
        .pipe(concat('main.css'))
        .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true })) // Создаем префиксы
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/css')) // Выгружаем результата в папку app/css
        .pipe(browserSync.reload({stream: true})) // Обновляем CSS на странице при изменении
});


gulp.task('browser-sync', function() { // Создаем таск browser-sync
    browserSync({ // Выполняем browserSync
        server: { // Определяем параметры сервера
            baseDir: 'app' // Директория для сервера - app
        },
        notify: false // Отключаем уведомления
    });
});


gulp.task('common-js', function() {
    return gulp.src([
        'app/js/common.js',
    ])
        .pipe(concat('common.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/js'));
});

gulp.task('libs-js', function() {
    return gulp.src([
        'app/libs/html5shiv/es5-shim.min.js',
        'app/libs/html5shiv/html5shiv.min.js',
        'app/libs/html5shiv/html5shiv-printshiv.min.js',
        'app/libs/respond/respond.min.js',
        'app/libs/jquery/dist/jquery.min.js',
    ])
    .pipe(gulp.dest('app/js'));
});

gulp.task('js', ['common-js', 'libs-js'], function() {
    return gulp.src([
        //'app/libs/jquery/dist/jquery.min.js', // Берем jQuery
        'app/plugins.js', // Берем jQuery
        'app/libs/maskedInput/jquery.maskedinput.min.js',
        'app/libs/slick/slick.min.js',
        'app/js/common.min.js', // Всегда в конце
    ])
        .pipe(concat('scripts.min.js'))
        .pipe(uglify()) // Минимизировать весь js (на выбор)
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('css-libs', ['scss'], function() {
    return gulp.src('app/css/main.css') // Выбираем файл для минификации
        .pipe(cssnano()) // Сжимаем
        .pipe(rename({suffix: '.min'})) // Добавляем суффикс .min
        .pipe(gulp.dest('app/css')); // Выгружаем в папку app/css
});

gulp.task('rigger', function () {
    gulp.src('app/templates/*.html')
        .pipe(rigger())
        .pipe(gulp.dest('app/'));
});

gulp.task('watch', ['browser-sync', 'scss', 'js', 'rigger'], function() {
    gulp.watch('app/scss/**/*.scss', ['scss']); // Наблюдение за sass файлами в папке sass
    gulp.watch('app/templates/**/*.html', ['rigger']);
    gulp.watch('app/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта
    gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js'], browserSync.reload);
});

gulp.task('clean', function() {
    return del.sync('dist'); // Удаляем папку dist перед сборкой
});

// Сжатие картинок
gulp.task('img', function() {
    return gulp.src('resources/img/**/*') // Берем все изображения из resources/img
        .pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('resources/imagemin')); // Выгружаем на resources/imagemin
});


gulp.task('build', ['clean', 'css-libs', 'js'], function() {

    var buildCssLibs = gulp.src('app/css/main.min.css')  // Переносим сжатый css в продакшен
    .pipe(gulp.dest('dist/css'))

    var buildFonts = gulp.src('app/fonts/**/*') // Переносим шрифты в продакшен
    .pipe(gulp.dest('dist/fonts'))

    var buildImg = gulp.src('app/img/**/*') // Переносим картинки в продакшен
    .pipe(gulp.dest('dist/img'))
    
    var buildJs = gulp.src([
        'app/js/scripts.min.js',
        'app/js/es5-shim.min.js',
        'app/js/html5shiv.min.js',
        'app/js/html5shiv-printshiv.min.js',
        'app/js/respond.min.js',
        'app/js/jquery.min.js',
    ]).pipe(gulp.dest('dist/js')); // Переносим js-файлы в продакшен

    var buildHtml = gulp.src('app/*.html') // Переносим HTML в продакшен
    .pipe(gulp.dest('dist'));

});

gulp.task('clear', function (callback) {
    return cache.clearAll();
})

gulp.task('default', ['watch']);
