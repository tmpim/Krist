{% extends 'layout.swig' %}

{% block content %}
<section id="left">
    <ul class="links">
        <li><a href="http://www.computercraft.info/forums2/index.php?/topic/22201-krist-minable-currency-that-works-across-servers/page__p__207703#entry207703">Forum Thread</a></li>
        <li><a href="/docs">API Documentation</a></li>
        <li><a href="http://kristweb.lemmmy.pw/">Web Wallet</a></li>
    </ul>

    <br /><br />
    <h3>Miners</h3>

    <ul class="links smaller">
        <li><a href="https://github.com/apemanzilla/turbokrist">(<b>GPU</b>) turbokrist by apemanzilla</a></li>
        <li><a href="https://github.com/1lann/krist-miner">(<b>CPU</b>) krist-miner by 1lann</a></li>
        <li><a href="https://github.com/Yevano/ytci-krist-miner">(<b>CPU</b>) ytci-krist-miner by Yevano</a></li>
    </ul>

    <br />
    <h3>Wallets</h3>

    <ul class="links smaller">
        <li><a href="http://kristweb.lemmmy.pw/">(<b>Web</b>) KristWeb by Lemmmy</a></li>
        <li><a href="https://github.com/apemanzilla/KWallet">(<b>Desktop</b>) KWallet by apemanzilla</a></li>
        <li><a href="https://pastebin.com/CChWjRx6">(<b>ComputerCraft</b>) kristwallet by 3d6</a></li>
    </ul>

    <br />
    <h3>Games & Tools</h3>

    <ul class="links smaller">
        <li><a href="https://kristminer.cf">KristMiner by lolmaker2002</a></li>
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
