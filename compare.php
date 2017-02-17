<?php
/**
 * Created by PhpStorm.
 * User: martinhalamicek
 * Date: 17/02/17
 * Time: 11:51
 */


var_dump($argv);



function compare($stack1, $stack2)
{
    $components1 = componentsToByIdMap(getComponents($stack1)->components);
    $components2 = componentsToByIdMap(getComponents($stack2)->components);

    $common = array_intersect_key($components1, $components2);
    foreach ($common as $componentId => $component) {
        var_dump(compare_two_object_recursive($component, $components2[$componentId]));
        die;
    }

    return [
        'missing' => array_diff(array_keys($components2), array_keys($components1)),
        'moreover' =>  array_diff(array_keys($components1), array_keys($components2)),
    ];
}



function getComponents($stack)
{
    return json_decode(file_get_contents("$stack/v2/storage"));
}

function componentsToByIdMap($components)
{
    $list = array_map(function($component) {
        return [
            'component' =>$component,
            'id' => $component->id
        ];
    }, $components);


    return array_reduce(
        $list,
        function($map, $current) {
            return array_merge($map, [
               "{$current['id']}" =>  $current['component'],
            ]);
        },
        []
    );
}

$diff = compare($argv[1], $argv[2]);
echo json_encode($diff, JSON_PRETTY_PRINT);