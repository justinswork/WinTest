"""Tests for VisionModel.parse_coordinates — coordinate extraction from model output."""

import pytest

from wintest.core.vision import VisionModel


class TestParseCoordinates:
    """Test the static coordinate parser that handles multiple response formats."""

    def test_bracket_format(self):
        assert VisionModel.parse_coordinates("[500, 300]") == (500, 300)

    def test_paren_format(self):
        assert VisionModel.parse_coordinates("(500, 300)") == (500, 300)

    def test_bare_format(self):
        assert VisionModel.parse_coordinates("500, 300") == (500, 300)

    def test_no_space_after_comma(self):
        assert VisionModel.parse_coordinates("[500,300]") == (500, 300)

    def test_extra_spaces(self):
        assert VisionModel.parse_coordinates("[500 ,  300]") == (500, 300)

    def test_embedded_in_prose(self):
        assert VisionModel.parse_coordinates(
            "The element is at [250, 750] on screen"
        ) == (250, 750)

    def test_boundary_minimum(self):
        assert VisionModel.parse_coordinates("[0, 0]") == (0, 0)

    def test_boundary_maximum(self):
        assert VisionModel.parse_coordinates("[1000, 1000]") == (1000, 1000)

    def test_x_out_of_range(self):
        assert VisionModel.parse_coordinates("[1001, 500]") is None

    def test_y_out_of_range(self):
        assert VisionModel.parse_coordinates("[500, 1001]") is None

    def test_both_out_of_range(self):
        assert VisionModel.parse_coordinates("[2000, 2000]") is None

    def test_no_coordinates(self):
        assert VisionModel.parse_coordinates("no coordinates here") is None

    def test_empty_string(self):
        assert VisionModel.parse_coordinates("") is None

    def test_first_match_wins(self):
        # Bracket pattern is tried first, so [500, 300] is returned
        assert VisionModel.parse_coordinates(
            "[500, 300] and also [100, 200]"
        ) == (500, 300)

    def test_bracket_priority_over_paren(self):
        assert VisionModel.parse_coordinates(
            "[500, 300] or maybe (100, 200)"
        ) == (500, 300)

    def test_bare_number_out_of_range_returns_none(self):
        # 1500 > 1000, so the match fails range check; no fallback match
        assert VisionModel.parse_coordinates("1500, 300") is None
