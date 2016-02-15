{% extends 'layout.swig' %}

{% block content %}
<section id="left">
    <ul class="links">
        <li><a href="http://www.computercraft.info/forums2/index.php?/topic/22201-krist-minable-currency-that-works-across-servers/page__p__207703#entry207703">Forum Thread</a></li>
        <li><a href="/docs">API Documentation</a></li>
        <li class="disabled"><span class="coming-soon">Web Wallet</span> (coming soon)</li>
    </ul>

    <br /><br />
    <h3>Useful Links</h3>

    <ul class="links smaller">
        <li><a href="https://github.com/apemanzilla/KWallet">KWallet by apemanzilla</a></li>
        <li><a href="http://klottery.sci4me.com/">KLottery by sci4me and Yevano</a></li>
        <li><a href="https://github.com/timia2109/KristWallet">Android Wallet by timia2109</a></li>
    </ul>
</section>

<section id="right">
    <h3>What's New <a href="https://github.com/Lemmmy/Krist/"><i class="fa fa-github github-icon"></i></a></h3>

    <div class="git-commits">
        {% for commit in commits  %}
        <a href="https://github.com/Lemmmy/Krist/commit/{{ commit.hash|escape }}">
            <div class="commit">
                    <div class="commit-bar"></div>
                    <div class="commit-info">
                        <span class="message" title="{{ commit.body|escape }}">{{ commit.subject|escape }}</span>
                        <div class="author">
                            <span class="author-name">{{ commit.authorName|escape }}</span> -
                            <span class="date">{{ commit.authorDateRel|escape }}</span>
                        </div>
                    </div>
            </div>
        </a>
        {% endfor %}
    </div>
</section>
{% endblock %}