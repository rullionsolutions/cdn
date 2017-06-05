/* global $, document, navigator, window, setTimeout, parseInt */
/*
FROM: /color_admin_v2.2/admin/template_content_html/assets/js/apps.js
Template Name: Color Admin - Responsive Admin Dashboard Template build with Twitter Bootstrap 3.3.7
Version: 2.1.0
Author: Sean Ngu
Website: http://www.seantheme.com/color-admin-v2.1/admin/html/
*/


x.sidebar = {
    minified: false,
    panel_action_running: false,
};

// main function
x.sidebar.init = function () {
    this.initSidebar();
    this.initTopMenu();
    this.initPageLoad();
    this.initComponent();
};

x.sidebar.initSidebar = function () {
    this.handleSidebarMenu();
    this.handleMobileSidebarToggle();
    this.handleSidebarMinify();
    this.handleMobileSidebar();
};

x.sidebar.initSidebarSelection = function () {
    this.handleClearSidebarSelection();
};

x.sidebar.initSidebarMobileSelection = function () {
    this.handleClearSidebarMobileSelection();
};

x.sidebar.initTopMenu = function () {
    this.handleUnlimitedTopMenuRender();
    this.handleTopMenuSubMenu();
    this.handleMobileTopMenuSubMenu();
    this.handleTopMenuMobileToggle();
};

x.sidebar.initPageLoad = function () {
    this.handlePageContentView();
};

x.sidebar.initComponent = function () {
    this.handleDraggablePanel();
    this.handleIEFullHeightContent();
    this.handleSlimScroll();
    this.handleUnlimitedTabsRender();
    this.handlePanelAction();
    this.handelTooltipPopoverActivation();
    this.handleScrollToTopButton();
    this.handleAfterPageLoadAddClass();
};

x.sidebar.scrollTop = function () {
    $("html, body").animate({
        scrollTop: $("body").offset().top,
    }, 0);
};

$(document).ready(function () {
    x.sidebar.init();
});


/* 01. Handle Scrollbar
------------------------------------------------ */
x.sidebar.handleSlimScroll = function () {
    var that = this;
    $("[data-scrollbar='true']").each(function () {
        that.generateSlimScroll($(this));
    });
};

x.sidebar.generateSlimScroll = function (element) {
    var dataHeight;
    var scrollBarOption = {
        alwaysVisible: true,
    };
    if ($(element).attr("data-init")) {
        return;
    }
    dataHeight = $(element).attr("data-height");
    dataHeight = (!dataHeight) ? $(element).height() : dataHeight;
    scrollBarOption.height = dataHeight;

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $(element).css("height", dataHeight);
        $(element).css("overflow-x", "scroll");
    } else {
        $(element).slimScroll(scrollBarOption);
    }
    $(element).attr("data-init", true);
};


x.sidebar.updateSidebarFromUI = function (area_id, page_id) {
    this.highlightActiveMenuOption(area_id, page_id);
    // if (this.minified) {
    //     x.sidebar.switchLinkButtonsToMiniMode();
    // }
};


/* 02. Handle Sidebar - Menu
------------------------------------------------ */
x.sidebar.handleSidebarMenu = function () {
    $(".sidebar .nav > .has-sub > a").click(function () {
        var target = $(this).next(".sub-menu");
        var otherMenu = ".sidebar .nav > li.has-sub > .sub-menu";

        if ($(".page-sidebar-minified").length === 0) {
            $(otherMenu).not(target).slideUp(250, function () {
                $(this).closest("li").removeClass("expand");
            });
            $(target).slideToggle(250, function () {
                var targetLi = $(this).closest("li");
                if ($(targetLi).hasClass("expand")) {
                    $(targetLi).removeClass("expand");
                } else {
                    $(targetLi).addClass("expand");
                }
            });
        }
    });
    $(".sidebar .nav > .has-sub .sub-menu li.has-sub > a").click(function () {
        if ($(".page-sidebar-minified").length === 0) {
            var target = $(this).next(".sub-menu");
            $(target).slideToggle(250);
        }
    });
};


/* 03. Handle Sidebar - Mobile View Toggle
------------------------------------------------ */
x.sidebar.handleMobileSidebarToggle = function () {
    var sidebarProgress = false;
    $(".sidebar").bind("click touchstart", function (e) {
        if ($(e.target).closest(".sidebar").length !== 0) {
            sidebarProgress = true;
        } else {
            sidebarProgress = false;
            e.stopPropagation();
        }
    });

    $(document).bind("click touchstart", function (e) {
        if ($(e.target).closest(".sidebar").length === 0) {
            sidebarProgress = false;
        }
        if (!e.isPropagationStopped() && sidebarProgress !== true) {
            if ($("#page-container").hasClass("page-sidebar-toggled")) {
                sidebarProgress = true;
                $("#page-container").removeClass("page-sidebar-toggled");
            }
            if ($(window).width() <= 767) {
                if ($("#page-container").hasClass("page-right-sidebar-toggled")) {
                    sidebarProgress = true;
                    $("#page-container").removeClass("page-right-sidebar-toggled");
                }
            }
        }
    });

    $("[data-click=right-sidebar-toggled]").click(function (e) {
        var targetContainer = "#page-container";
        var targetClass = "page-right-sidebar-collapsed";
        e.stopPropagation();
        targetClass = ($(window).width() < 979) ? "page-right-sidebar-toggled" : targetClass;
        if ($(targetContainer).hasClass(targetClass)) {
            $(targetContainer).removeClass(targetClass);
        } else if (sidebarProgress !== true) {
            $(targetContainer).addClass(targetClass);
        } else {
            sidebarProgress = false;
        }
        if ($(window).width() < 480) {
            $("#page-container").removeClass("page-sidebar-toggled");
        }
        $(window).trigger("resize");
    });

    $("[data-click=sidebar-toggled]").click(function (e) {
        var sidebarClass = "page-sidebar-toggled";
        var targetContainer = "#page-container";
        e.stopPropagation();

        if ($(targetContainer).hasClass(sidebarClass)) {
            $(targetContainer).removeClass(sidebarClass);
        } else if (sidebarProgress !== true) {
            $(targetContainer).addClass(sidebarClass);
        } else {
            sidebarProgress = false;
        }
        if ($(window).width() < 480) {
            $("#page-container").removeClass("page-right-sidebar-toggled");
        }
    });
};


/* 04. Handle Sidebar - Minify / Expand
------------------------------------------------ */
x.sidebar.handleSidebarMinify = function () {
    $("[data-click=sidebar-minify]").click(function (e) {
        var sidebarClass = "page-sidebar-minified";
        var targetContainer = "#page-container";
        e.preventDefault();
        $("#sidebar [data-scrollbar=true]").css("margin-top", "0");
        $("#sidebar [data-scrollbar=true]").removeAttr("data-init");
        $("#sidebar [data-scrollbar=true]").stop();
        if (x.sidebar.minified) {
            x.sidebar.minified = false;
            $(targetContainer).removeClass(sidebarClass);
            if ($(targetContainer).hasClass("page-sidebar-fixed")) {
                if ($("#sidebar .slimScrollDiv").length !== 0) {
                    $("#sidebar [data-scrollbar=true]").slimScroll({ destroy: true, });
                    $("#sidebar [data-scrollbar=true]").removeAttr("style");
                }
                x.sidebar.generateSlimScroll($("#sidebar [data-scrollbar=true]"));
                $("#sidebar [data-scrollbar=true]").trigger("mouseover");
            } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                if ($("#sidebar .slimScrollDiv").length !== 0) {
                    $("#sidebar [data-scrollbar=true]").slimScroll({ destroy: true, });
                    $("#sidebar [data-scrollbar=true]").removeAttr("style");
                }
                x.sidebar.generateSlimScroll($("#sidebar [data-scrollbar=true]"));
            }
            // x.sidebar.switchLinkButtonsToMaxiMode();
        } else {
            x.sidebar.minified = true;
            $(targetContainer).addClass(sidebarClass);

            if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                if ($(targetContainer).hasClass("page-sidebar-fixed")) {
                    $("#sidebar [data-scrollbar=true]").slimScroll({ destroy: true, });
                    $("#sidebar [data-scrollbar=true]").removeAttr("style");
                }
                $("#sidebar [data-scrollbar=true]").trigger("mouseover");
            } else {
                $("#sidebar [data-scrollbar=true]").css("margin-top", "0");
                $("#sidebar [data-scrollbar=true]").css("overflow", "visible");
            }
            // x.sidebar.switchLinkButtonsToMiniMode();
        }
        $(window).trigger("resize");
    });
};


x.sidebar.highlightActiveMenuOption = function (area_id, page_id) {
    $(".sidebar .nav li").removeClass("active");
    if (area_id) {
        $(".sidebar .nav li.css_menu_area_" + area_id).addClass("active");
    }
    if (page_id) {
        $(".sidebar .nav li.css_menu_page_" + page_id).addClass("active");
    }
};


x.sidebar.switchLinkButtonsToMiniMode = function () {
    $("ul.css_page_links > a").each(function () {
        var text = $(this).text();
        $(this).text(text.substr(text.length - 1));
        $(this).attr("title", text.substr(0, text.length - 2));
    });
};


x.sidebar.switchLinkButtonsToMaxiMode = function () {
    $("ul.css_page_links > a").each(function () {
        var text = $(this).attr("title") + " " + $(this).text();
        $(this).text(text);
        $(this).removeAttr("title");
    });
};


/* 05. Handle Page Load - Fade in
------------------------------------------------ */
x.sidebar.handlePageContentView = function () {
    $.when($("#page-loader").addClass("hide")).done(function () {
        $("#page-container").addClass("in");
    });
};


/* 06. Handle Panel - Remove / Reload / Collapse / Expand
------------------------------------------------ */
x.sidebar.handlePanelAction = function () {
    if (this.panel_action_running) {
        return;
    }
    this.panel_action_running = true;

    // remove
    $(document).on("hover", "[data-click=panel-remove]", function (e) {
        if (!$(this).attr("data-init")) {
            $(this).tooltip({
                title: "Remove",
                placement: "bottom",
                trigger: "hover",
                container: "body",
            });
            $(this).tooltip("show");
            $(this).attr("data-init", true);
        }
    });
    $(document).on("click", "[data-click=panel-remove]", function (e) {
        e.preventDefault();
        $(this).tooltip("destroy");
        $(this).closest(".panel").remove();
    });

    // collapse
    $(document).on("hover", "[data-click=panel-collapse]", function (e) {
        if (!$(this).attr("data-init")) {
            $(this).tooltip({
                title: "Collapse / Expand",
                placement: "bottom",
                trigger: "hover",
                container: "body",
            });
            $(this).tooltip("show");
            $(this).attr("data-init", true);
        }
    });
    $(document).on("click", "[data-click=panel-collapse]", function (e) {
        e.preventDefault();
        $(this).closest(".panel").find(".panel-body").slideToggle();
        $(this).children("i.fa").each(function () {
            if ($(this).hasClass("fa-plus")) {
                $(this).removeClass("fa-plus");
                $(this).addClass("fa-minus");
            } else {
                $(this).addClass("fa-plus");
                $(this).removeClass("fa-minus");
            }
        });
    });

    // reload
    $(document).on("hover", "[data-click=panel-reload]", function (e) {
        if (!$(this).attr("data-init")) {
            $(this).tooltip({
                title: "Reload",
                placement: "bottom",
                trigger: "hover",
                container: "body",
            });
            $(this).tooltip("show");
            $(this).attr("data-init", true);
        }
    });
    $(document).on("click", "[data-click=panel-reload]", function (e) {
        var target = $(this).closest(".panel");
        e.preventDefault();
        if (!$(target).hasClass("panel-loading")) {
            var targetBody = $(target).find(".panel-body");
            var spinnerHtml = "<div class='panel-loader'><span class='spinner-small'></span></div>";
            $(target).addClass("panel-loading");
            $(targetBody).prepend(spinnerHtml);
            setTimeout(function () {
                $(target).removeClass("panel-loading");
                $(target).find(".panel-loader").remove();
            }, 2000);
        }
    });

    // expand
    $(document).on("hover", "[data-click=panel-expand]", function (e) {
        if (!$(this).attr("data-init")) {
            $(this).tooltip({
                title: "Expand / Compress",
                placement: "bottom",
                trigger: "hover",
                container: "body",
            });
            $(this).tooltip("show");
            $(this).attr("data-init", true);
        }
    });
    $(document).on("click", "[data-click=panel-expand]", function (e) {
        e.preventDefault();
        var target = $(this).closest(".panel");
        var targetBody = $(target).find(".panel-body");
        var targetTop = 40;
        if ($(targetBody).length !== 0) {
            var targetOffsetTop = $(target).offset().top;
            var targetBodyOffsetTop = $(targetBody).offset().top;
            targetTop = targetBodyOffsetTop - targetOffsetTop;
        }

        if ($("body").hasClass("panel-expand") && $(target).hasClass("panel-expand")) {
            $("body, .panel").removeClass("panel-expand");
            $(".panel").removeAttr("style");
            $(targetBody).removeAttr("style");
        } else {
            $("body").addClass("panel-expand");
            $(this).closest(".panel").addClass("panel-expand");

            if ($(targetBody).length !== 0 && targetTop != 40) {
                var finalHeight = 40;
                $(target).find(" > *").each(function () {
                    var targetClass = $(this).attr("class");

                    if (targetClass != "panel-heading" && targetClass != "panel-body") {
                        finalHeight += $(this).height() + 30;
                    }
                });
                if (finalHeight != 40) {
                    $(targetBody).css("top", finalHeight + "px");
                }
            }
        }
        $(window).trigger("resize");
    });
};


/* 07. Handle Panel - Draggable
------------------------------------------------ */
x.sidebar.handleDraggablePanel = function () {
    var target = $(".panel").parent("[class*=col]");
    var targetHandle = ".panel-heading";
    var connectedTarget = ".row > [class*=col]";

    $(target).sortable({
        handle: targetHandle,
        connectWith: connectedTarget,
        stop: function (event, ui) {
            ui.item.find(".panel-title").append("<i class='fa fa-refresh fa-spin m-l-5' data-id='title-spinner'></i>");
            x.sidebar.handleSavePanelPosition(ui.item);
        },
    });
};


/* 08. Handle Tooltip & Popover Activation
------------------------------------------------ */
x.sidebar.handelTooltipPopoverActivation = function () {
    if ($("[data-toggle=tooltip]").length !== 0) {
        $("[data-toggle=tooltip]").tooltip();
    }
    if ($("[data-toggle=popover]").length !== 0) {
        $("[data-toggle=popover]").popover();
    }
};


/* 09. Handle Scroll to Top Button Activation
------------------------------------------------ */
x.sidebar.handleScrollToTopButton = function () {
    $(document).scroll(function () {
        var totalScroll = $(document).scrollTop();

        if (totalScroll >= 200) {
            $("[data-click=scroll-top]").addClass("in");
        } else {
            $("[data-click=scroll-top]").removeClass("in");
        }
    });

    $("[data-click=scroll-top]").click(function (e) {
        e.preventDefault();
        $("html, body").animate({
            scrollTop: $("body").offset().top,
        }, 500);
    });
};


/* 12. Handle After Page Load Add Class Function - added in V1.2
------------------------------------------------ */
x.sidebar.handleAfterPageLoadAddClass = function () {
    if ($("[data-pageload-addclass]").length !== 0) {
        $(window).load(function () {
            $("[data-pageload-addclass]").each(function () {
                var targetClass = $(this).attr("data-pageload-addclass");
                $(this).addClass(targetClass);
            });
        });
    }
};


/* 16. Handle IE Full Height Page Compatibility - added in V1.6
------------------------------------------------ */
x.sidebar.handleIEFullHeightContent = function () {
    var userAgent = window.navigator.userAgent;
    var msie = userAgent.indexOf("MSIE ");

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
        $(".vertical-box-row [data-scrollbar=true][data-height='100%']").each(function () {
            var targetRow = $(this).closest(".vertical-box-row");
            var targetHeight = $(targetRow).height();
            $(targetRow).find(".vertical-box-cell").height(targetHeight);
        });
    }
};


/* 17. Handle Unlimited Nav Tabs - added in V1.6
------------------------------------------------ */
x.sidebar.handleUnlimitedTabsRender = function () {
    // function handle tab overflow scroll width
    function handleTabOverflowScrollWidth(obj, animationSpeed) {
        var marginLeft = parseInt($(obj).css("margin-left"));
        var viewWidth = $(obj).width();
        var prevWidth = $(obj).find("li.active").width();
        var speed = (animationSpeed > -1) ? animationSpeed : 150;
        var fullWidth = 0;

        $(obj).find("li.active").prevAll().each(function () {
            prevWidth += $(this).width();
        });

        $(obj).find("li").each(function () {
            fullWidth += $(this).width();
        });

        if (prevWidth >= viewWidth) {
            var finalScrollWidth = prevWidth - viewWidth;
            if (fullWidth != prevWidth) {
                finalScrollWidth += 40;
            }
            $(obj).find(".nav.nav-tabs").animate({ marginLeft: "-" + finalScrollWidth + "px"}, speed);
        }

        if (prevWidth != fullWidth && fullWidth >= viewWidth) {
            $(obj).addClass("overflow-right");
        } else {
            $(obj).removeClass("overflow-right");
        }

        if (prevWidth >= viewWidth && fullWidth >= viewWidth) {
            $(obj).addClass("overflow-left");
        } else {
            $(obj).removeClass("overflow-left");
        }
    }

    // function handle tab button action - next / prev
    function handleTabButtonAction(element, direction) {
        var obj = $(element).closest(".tab-overflow");
        var marginLeft = parseInt($(obj).find(".nav.nav-tabs").css("margin-left"));
        var containerWidth = $(obj).width();
        var totalWidth = 0;
        var finalScrollWidth = 0;

        $(obj).find("li").each(function () {
            if (!$(this).hasClass("next-button") && !$(this).hasClass("prev-button")) {
                totalWidth += $(this).width();
            }
        });

        switch (direction) {
            case "next":
                var widthLeft = totalWidth + marginLeft - containerWidth;
                if (widthLeft <= containerWidth) {
                    finalScrollWidth = widthLeft - marginLeft;
                    setTimeout(function () {
                        $(obj).removeClass("overflow-right");
                    }, 150);
                } else {
                    finalScrollWidth = containerWidth - marginLeft - 80;
                }

                if (finalScrollWidth != 0) {
                    $(obj).find(".nav.nav-tabs").animate({ marginLeft: "-" + finalScrollWidth + "px"}, 150, function () {
                        $(obj).addClass("overflow-left");
                    });
                }
                break;
            case "prev":
                var widthLeft = -marginLeft;

                if (widthLeft <= containerWidth) {
                    $(obj).removeClass("overflow-left");
                    finalScrollWidth = 0;
                } else {
                    finalScrollWidth = widthLeft - containerWidth + 80;
                }
                $(obj).find(".nav.nav-tabs").animate({ marginLeft: "-" + finalScrollWidth + "px"}, 150, function () {
                    $(obj).addClass("overflow-right");
                });
                break;
        }
    }

    // handle page load active tab focus
    function handlePageLoadTabFocus() {
        $(".tab-overflow").each(function () {
            var targetWidth = $(this).width();
            var targetInnerWidth = 0;
            var targetTab = $(this);
            var scrollWidth = targetWidth;

            $(targetTab).find("li").each(function () {
                var targetLi = $(this);
                targetInnerWidth += $(targetLi).width();

                if ($(targetLi).hasClass("active") && targetInnerWidth > targetWidth) {
                    scrollWidth -= targetInnerWidth;
                }
            });

            handleTabOverflowScrollWidth(this, 0);
        });
    }

    // handle tab next button click action
    $("[data-click='next-tab']").click(function (e) {
        e.preventDefault();
        handleTabButtonAction(this, "next");
    });

    // handle tab prev button click action
    $("[data-click='prev-tab']").click(function (e) {
        e.preventDefault();
        handleTabButtonAction(this, "prev");
    });

    // handle unlimited tabs responsive setting
    $(window).resize(function () {
        $(".tab-overflow .nav.nav-tabs").removeAttr("style");
        handlePageLoadTabFocus();
    });

    handlePageLoadTabFocus();
};


/* 18. Handle Mobile Sidebar Scrolling Feature - added in V1.7
------------------------------------------------ */
x.sidebar.handleMobileSidebar = function () {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        if ($("#page-container").hasClass("page-sidebar-minified")) {
            $("#sidebar [data-scrollbar=true]").css("overflow", "visible");
            $(".page-sidebar-minified #sidebar [data-scrollbar=true]").slimScroll({ destroy: true, });
            $(".page-sidebar-minified #sidebar [data-scrollbar=true]").removeAttr("style");
            $(".page-sidebar-minified #sidebar [data-scrollbar=true]").trigger("mouseover");
        }
    }

    var oriTouch = 0;
    $(".page-sidebar-minified .sidebar [data-scrollbar=true] a").bind("touchstart", function (e) {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        var touchVertical = touch.pageY;
        oriTouch = touchVertical - parseInt($(this).closest("[data-scrollbar=true]").css("margin-top"));
    });

    $(".page-sidebar-minified .sidebar [data-scrollbar=true] a").bind("touchmove", function (e) {
        e.preventDefault();
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            var touchVertical = touch.pageY;
            var elementTop = touchVertical - oriTouch;

            $(this).closest("[data-scrollbar=true]").css("margin-top", elementTop + "px");
        }
    });

    $(".page-sidebar-minified .sidebar [data-scrollbar=true] a").bind("touchend", function (e) {
        var targetScrollBar = $(this).closest("[data-scrollbar=true]");
        var windowHeight = $(window).height();
        var sidebarTopPosition = parseInt($("#sidebar").css("padding-top"));
        var sidebarContainerHeight = $("#sidebar").height();
        oriTouch = $(targetScrollBar).css("margin-top");

        var sidebarHeight = sidebarTopPosition;
        $(".sidebar").not(".sidebar-right").find(".nav").each(function () {
            sidebarHeight += $(this).height();
        });
        var finalHeight = -parseInt(oriTouch) + $(".sidebar").height();
        if (finalHeight >= sidebarHeight && windowHeight <= sidebarHeight && sidebarContainerHeight <= sidebarHeight) {
            var finalMargin = windowHeight - sidebarHeight - 20;
            $(targetScrollBar).animate({marginTop: finalMargin + "px"});
        } else if (parseInt(oriTouch) >= 0 || sidebarContainerHeight >= sidebarHeight) {
            $(targetScrollBar).animate({marginTop: "0px"});
        } else {
            finalMargin = oriTouch;
            $(targetScrollBar).animate({marginTop: finalMargin + "px"});
        }
    });
};


/* 19. Handle Top Menu - Unlimited Top Menu Render - added in V1.9
------------------------------------------------ */
x.sidebar.handleUnlimitedTopMenuRender = function () {
    // function handle menu button action - next / prev
    function handleMenuButtonAction(element, direction) {
        var obj = $(element).closest(".nav");
        var marginLeft = parseInt($(obj).css("margin-left"));
        var containerWidth = $(".top-menu").width() - 88;
        var totalWidth = 0;
        var finalScrollWidth = 0;

        $(obj).find("li").each(function () {
            if (!$(this).hasClass("menu-control")) {
                totalWidth += $(this).width();
            }
        });

        switch (direction) {
            case "next":
                var widthLeft = totalWidth + marginLeft - containerWidth;
                if (widthLeft <= containerWidth) {
                    finalScrollWidth = widthLeft - marginLeft + 128;
                    setTimeout(function () {
                        $(obj).find(".menu-control.menu-control-right").removeClass("show");
                    }, 150);
                } else {
                    finalScrollWidth = containerWidth - marginLeft - 128;
                }

                if (finalScrollWidth != 0) {
                    $(obj).animate({ marginLeft: "-" + finalScrollWidth + "px"}, 150, function () {
                        $(obj).find(".menu-control.menu-control-left").addClass("show");
                    });
                }
                break;
            case "prev":
                var widthLeft = -marginLeft;

                if (widthLeft <= containerWidth) {
                    $(obj).find(".menu-control.menu-control-left").removeClass("show");
                    finalScrollWidth = 0;
                } else {
                    finalScrollWidth = widthLeft - containerWidth + 88;
                }
                $(obj).animate({ marginLeft: "-" + finalScrollWidth + "px", }, 150, function () {
                    $(obj).find(".menu-control.menu-control-right").addClass("show");
                });
                break;
        }
    }

    // handle page load active menu focus
    function handlePageLoadMenuFocus() {
        var targetMenu = $(".top-menu .nav");
        var targetList = $(".top-menu .nav > li");
        var targetActiveList = $(".top-menu .nav > li.active");
        var targetContainer = $(".top-menu");

        var marginLeft = parseInt($(targetMenu).css("margin-left"));
        var viewWidth = $(targetContainer).width() - 128;
        var prevWidth = $(".top-menu .nav > li.active").width();
        var speed = 0;
        var fullWidth = 0;

        $(targetActiveList).prevAll().each(function () {
            prevWidth += $(this).width();
        });

        $(targetList).each(function () {
            if (!$(this).hasClass("menu-control")) {
                fullWidth += $(this).width();
            }
        });

        if (prevWidth >= viewWidth) {
            var finalScrollWidth = prevWidth - viewWidth + 128;
            $(targetMenu).animate({ marginLeft: "-" + finalScrollWidth + "px", }, speed);
        }

        if (prevWidth != fullWidth && fullWidth >= viewWidth) {
            $(targetMenu).find(".menu-control.menu-control-right").addClass("show");
        } else {
            $(targetMenu).find(".menu-control.menu-control-right").removeClass("show");
        }

        if (prevWidth >= viewWidth && fullWidth >= viewWidth) {
            $(targetMenu).find(".menu-control.menu-control-left").addClass("show");
        } else {
            $(targetMenu).find(".menu-control.menu-control-left").removeClass("show");
        }
    }

    // handle menu next button click action
    $("[data-click='next-menu']").click(function (e) {
        e.preventDefault();
        handleMenuButtonAction(this, "next");
    });

    // handle menu prev button click action
    $("[data-click='prev-menu']").click(function (e) {
        e.preventDefault();
        handleMenuButtonAction(this, "prev");
    });

    // handle unlimited menu responsive setting
    $(window).resize(function () {
        $(".top-menu .nav").removeAttr("style");
        handlePageLoadMenuFocus();
    });

    handlePageLoadMenuFocus();
};


/* 20. Handle Top Menu - Sub Menu Toggle - added in V1.9
------------------------------------------------ */
x.sidebar.handleTopMenuSubMenu = function () {
    $(".top-menu .sub-menu .has-sub > a").click(function () {
        var target = $(this).closest("li").find(".sub-menu").first();
        var otherMenu = $(this).closest("ul").find(".sub-menu").not(target);
        $(otherMenu).not(target).slideUp(250, function () {
            $(this).closest("li").removeClass("expand");
        });
        $(target).slideToggle(250, function () {
            var targetLi = $(this).closest("li");
            if ($(targetLi).hasClass("expand")) {
                $(targetLi).removeClass("expand");
            } else {
                $(targetLi).addClass("expand");
            }
        });
    });
};


/* 21. Handle Top Menu - Mobile Sub Menu Toggle - added in V1.9
------------------------------------------------ */
x.sidebar.handleMobileTopMenuSubMenu = function () {
    $(".top-menu .nav > li.has-sub > a").click(function () {
        if ($(window).width() <= 767) {
            var target = $(this).closest("li").find(".sub-menu").first();
            var otherMenu = $(this).closest("ul").find(".sub-menu").not(target);
            $(otherMenu).not(target).slideUp(250, function () {
                $(this).closest("li").removeClass("expand");
            });
            $(target).slideToggle(250, function () {
                var targetLi = $(this).closest("li");
                if ($(targetLi).hasClass("expand")) {
                    $(targetLi).removeClass("expand");
                } else {
                    $(targetLi).addClass("expand");
                }
            });
        }
    });
};


/* 22. Handle Top Menu - Mobile Top Menu Toggle - added in V1.9
------------------------------------------------ */
x.sidebar.handleTopMenuMobileToggle = function () {
    $("[data-click='top-menu-toggled']").click(function () {
        $(".top-menu").slideToggle(250);
    });
};


/* 23. Handle Clear Sidebar Selection & Hide Mobile Menu - added in V1.9
------------------------------------------------ */
x.sidebar.handleClearSidebarSelection = function () {
    $(".sidebar .nav > li, .sidebar .nav .sub-menu").removeClass("expand").removeAttr("style");
};

x.sidebar.handleClearSidebarMobileSelection = function () {
    $("#page-container").removeClass("page-sidebar-toggled");
};

