{% extends 'layout.swig' %}

{% block style %}
    <style>
        body {
            background-image: -webkit-gradient(
                    linear,
                    left top,
                    right bottom,
                    color-stop(0, #58aeea),
                    color-stop(1, #d25151)
            );

            background-image: -o-linear-gradient(right bottom, #58aeea 0%, #d25151 100%);
            background-image: -moz-linear-gradient(right bottom, #58aeea 0%, #d25151 100%);
            background-image: -webkit-linear-gradient(right bottom, #58aeea 0%, #d25151 100%);
            background-image: -ms-linear-gradient(right bottom, #58aeea 0%, #d25151 100%);
            background-image: linear-gradient(to right bottom, #58aeea 0%, #d25151 100%);
        }
    </style>
{% endblock %}

{% block content %}
    <section id="left">
        <h3>Error</h3>
        <p>There was an internal server error.</p>
    </section>
{% endblock %}