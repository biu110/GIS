require([
  "esri/config",
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/SceneLayer",
  "esri/renderers/UniqueValueRenderer",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch",
  "esri/layers/support/SceneFilter",
  "esri/widgets/DirectLineMeasurement3D",
  "esri/widgets/AreaMeasurement3D",
  "esri/core/promiseUtils",
  "esri/layers/FeatureLayer",
  "esri/geometry/geometryEngine",
  "esri/geometry/Polyline",
  "esri/geometry/Polygon",
  "esri/Graphic"
], function (esriConfig, Map, SceneView, SceneLayer,
  UniqueValueRenderer, GraphicsLayer, Sketch,
  SceneFilter, DirectLineMeasurement3D, AreaMeasurement3D, promiseUtils,
  FeatureLayer, geometryEngine, Polyline, Polygon, Graphic) {
  
  let activeWidget = null;
  esriConfig.apiKey = "AAPK816905600159480ca9b2abfe361e6207iPYVIdXZ7gXCjVQi066hTutMI40_AoNTxhbV_ORI2IGq6IHV5UXSPhF8UH2WAzi1";
  
  /*
  步骤：
  1、加载底图
  2、加载3D场景图层
  3、对材质进行唯一值渲染
  4、添加绘制几何功能
  5、添加3D的量测微件
  6、空间分析
  */

  //1、加入底图
  const map = new Map({
    basemap: "arcgis/topographic", // basemap styles service
  });
  const view = new SceneView({
    container: "viewDiv",
    map: map,
    camera: {
      position: [24.85, 60.16, 1000],
      tilt: 81,
      heading: 50
    }
  });
  
  //2、加载3D场景图层
  const sceneLayer = new SceneLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/STM____F_Helsinki__Textured_buildings_with_attributes/SceneServer/layers/0",
    popupEnabled: false
  });
  map.add(sceneLayer);

  const symbol = {
    type: "mesh-3d", // autocasts as new MeshSymbol3D()
    symbolLayers: [
      {
        type: "fill", // autocasts as new FillSymbol3DLayer()
        // If the value of material is not assigned, the default color will be grey
        material: {
          color: [255, 255, 255]
        }
      }
    ]
  };
  // Add the renderer to sceneLayer
  sceneLayer.renderer = {
    type: "simple", // autocasts as new SimpleRenderer()
    symbol: symbol
  };
  
  //3、对材质进行唯一值渲染
  const renderer = new UniqueValueRenderer({
    field: "buildingMaterial",
    defaultSymbol: {
      type: "mesh-3d",
      symbolLayers: [{
        type: "fill",
        material: {
          color: [255, 255, 255]
        }
      }]
    },
   uniqueValueInfos: [
      {
        value: "concrete or lightweight concrete",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: [128, 128, 128]
            }
          }]
        }
      },
      {
        value: "wood",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: [150, 75, 0]
            }
          }]
        }
      },
      {
        value: "brick",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: [150, 75, 255]
            }
          }]
        }
      },
      {
        value: "steel",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: [50, 15, 255]
            }
          }]
        }
      },
      {
        value: "other",
        symbol: {
          type: "mesh-3d",
          symbolLayers: [{
            type: "fill",
            material: {
              color: [0, 7, 25]
            }
          }]
        }
      },
    ] 
  });
  //将渲染结果输出到图层上
  sceneLayer.renderer = renderer;
  
  //先定义一个过滤的符号
  const filterSymbol = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: [255, 140, 0, 0.3],
    style: "solid",
    outline: {
      // autocasts as new SimpleLineSymbol()
      color: [255, 140, 0, 1],
      width: 2
    }
  };

  //在定义一个过滤图形，把过滤符号和几何体都放进去
  const graphic = new Graphic({
    symbol: filterSymbol,
    geometry: {
      type: "polygon",
      spatialReference: {
        wkid: 102100
      }
    }
  });
  //定义一个图形层，把刚刚定义的图形放到图形层中
  const graphicsLayer = new GraphicsLayer({
    title: "Filter Layer",
    graphics: [graphic],
    elevationInfo: {
      mode: "on-the-ground"
    }
  });
  //用add方法将图形层添加到地图中
  map.add(graphicsLayer);
  //定义空间关系，默认为包含
  let spatialRelationship = "contains";
  //添加sketch功能，在图形层绘制几何图形
  const sketch = new Sketch({
    layer: graphicsLayer,
    view: view,
    creationMode: "update",
    container: "sketchContainer",
  });
  //设置绘制时的样式，这里设置成刚刚创建的过滤的符号
  sketch.viewModel.polygonSymbol = filterSymbol;
  //添加sketch添加到视图中
  view.ui.add("sketch", "top-right");
  //获取两个按钮
  const contains = document.getElementById("contains");
  const disjoint = document.getElementById("disjoint");
  //添加监听事件，鼠标点击即可响应
  contains.addEventListener("click", (event) => {
    spatialRelationship = "contains";
    applyFilter(spatialRelationship);
    disjoint.appearance = "outline";
    contains.appearance = "solid";
  });

  disjoint.addEventListener("click", (event) => {
    spatialRelationship = "disjoint";
    applyFilter(spatialRelationship);
    disjoint.appearance = "solid";
    contains.appearance = "outline";
  });

  // 定义一个过滤函数，根据用户选择的空间关系，过滤建筑物
  function applyFilter(spatialRelationship) {
    //通过map的方法将graphicsLayer中的所有图形取出来
    const geometries = graphicsLayer.graphics.map(graphic => graphic.geometry);
    //判断是否有几何体，若有，则创建一个过滤层
    if (geometries.length > 0) {
      const filter = new SceneFilter({
        geometries: geometries,
        spatialRelationship: spatialRelationship
      });
      // 应用场景过滤器到建筑图层
      sceneLayer.filter = filter;
    } else {
      // 如果没有几何体，清空过滤器
      sceneLayer.filter = null;
    }
  }

  // add the toolbar for the measurement widgets
  view.ui.add("topbar", "top-right");
  document.getElementById("distanceButton").addEventListener("click", (event) => {
    setActiveWidget(null);
    if (!event.target.classList.contains("active")) {
      setActiveWidget("distance");
    } else {
      setActiveButton(null);
    }
  });
ge
  document.getElementById("areaButton").addEventListener("click", (event) => {
    setActiveWidget(null);
    if (!event.target.classList.contains("active")) {
      setActiveWidget("area");
    } else {
      setActiveButton(null);
    }
  });

  function setActiveWidget(type) {
    switch (type) {
      case "distance":
        activeWidget = new DirectLineMeasurement3D({
          view: view
        });

        // skip the initial 'new measurement' button
        activeWidget.viewModel.start().catch((error) => {
          if (promiseUtils.isAbortError(error)) {
            return; // don't display abort errors
          }
          throw error; // throw other errors since they are of interest
        });

        view.ui.add(activeWidget, "top-right");
        setActiveButton(document.getElementById("distanceButton"));
        break;
      case "area":
        activeWidget = new AreaMeasurement3D({
          view: view
        });

        // skip the initial 'new measurement' button
        activeWidget.viewModel.start().catch((error) => {
          if (promiseUtils.isAbortError(error)) {
            return; // don't display abort errors
          }
          throw error; // throw other errors since they are of interest
        });

        view.ui.add(activeWidget, "top-right");
        setActiveButton(document.getElementById("areaButton"));
        break;
      case null:
        if (activeWidget) {
          view.ui.remove(activeWidget);
          activeWidget.destroy();
          activeWidget = null;
        }
        break;
    }
  }

  function setActiveButton(selectedButton) {
    // focus the view to activate keyboard shortcuts for sketching
    view.focus();
    const elements = document.getElementsByClassName("active");
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active");
    }
    if (selectedButton) {
      selectedButton.classList.add("active");
    }
  }
});





  /*6、空间分析：
  6.1加载要素图层
  6.2通过FeatureLayer的queryObjectsIds方法进行空间查询
  6.3显示查询结果
  */




   /*  // 线要素图层
    const lineLayer = new FeatureLayer({
      url: "你的线要素图层URL"
    });

    // 面要素图层
    const polygonLayer = new FeatureLayer({
      url: "你的面要素图层URL"
    });

    // 查询线要素和面要素
    const lineQuery = lineLayer.createQuery();
    lineQuery.where = "lid=0 OR lid=2";
    lineLayer.queryFeatures(lineQuery).then(lineResults => {
      const lines = lineResults.features.map(feature => feature.geometry);
      const polygonQuery = polygonLayer.createQuery();
      polygonQuery.where = "pid=1";
      polygonLayer.queryFeatures(polygonQuery).then(polygonResults => {
        const polygons = polygonResults.features.map(feature => feature.geometry);

        // 判断交叉
        lines.forEach(line => {
          polygons.forEach(polygon => {
            if (geometryEngine.crosses(line, polygon)) {
              console.log("线与面存在交叉");

              // 使用线裁切面
              const cutPolygons = geometryEngine.cut(polygon, line);
              cutPolygons.forEach(cutPolygon => {
                // 创建图形添加到地图上
                const graphic = new Graphic({
                  geometry: cutPolygon,
                  symbol: {
                    type: "simple-fill",
                    color: [0, 255, 0, 0.5],
                    outline: {
                      color: "white",
                      width: 1
                    }
                  }
                });
                view.graphics.add(graphic);
              });
            } else {
              console.log("线与面不交叉");
            }
          });
        });
      });
    }); 
  });
  view.ui.add("cutfeature", "top-right");
}); */
