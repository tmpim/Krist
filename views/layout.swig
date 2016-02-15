<!doctype html>
<html lang="en">
<head>
    <title>Krist</title>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:400,300">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Alegreya+Sans:100">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="/style.css">
</head>
<body>
<header>
    <div class="title">
        <h1>Krist</h1>

        <p span="small">A minable currency that works across servers</p>
    </div>
</header>
<main>
    {% block content %}{% endblock %}
</main>
<footer>
    Created by <a href="http://www.computercraft.info/forums2/index.php?/user/35172-3d6/">3d6</a> and <a href="http://www.computercraft.info/forums2/index.php?/user/30838-lemmmy/">Lemmmy</a>
    {% if debug %}
        <br /><br /><p class="small">Test Site</p>
    {% endif %}
</footer>
</body>
</html>